import { Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../../../common/logging/logging.helper";
import { RedisStoreService } from "../../redis-store/redis-store.service";
import { EligibilityStore } from "../../redis-store/stores/eligibility-store";
import {
  ProductMapping,
  ProductMappingStore,
} from "../../redis-store/stores/product-mapping-store";
import { DiscountResponseDto } from "../dto/discount-response.dto";
import { computeRuleHash } from "../engine/discount-hash.utils";
import { DiscountEligibilityBuilder } from "./discount-eligibility-builder.service";
import { ProductMappingBuilder } from "./product-mapping-builder.service";
import { RulesetVersionManager } from "./ruleset-version-manager.service";

/**
 * Ruleset bundle metadata
 */
export interface RulesetBundleMetadata {
  version: number;
  rulesCount: number;
  bundleSizeKB: number;
  ruleHash: string;
  createdAt: string;
  eligibilitySetsCount: number;
  productMappingsCount: number;
}

/**
 * Complete ruleset bundle including rules, eligibility, and mappings
 */
export interface RulesetBundle {
  version: number;
  rules: DiscountResponseDto[];
  metadata: RulesetBundleMetadata;
}

/**
 * Service for building and storing versioned discount ruleset bundles
 * Ensures atomic, consistent rule updates with zero downtime
 */
@Injectable()
export class RulesetBundleService implements OnModuleInit {
  private client!: Redis;
  private readonly redisStoreService: RedisStoreService;
  private readonly bundleKeyPrefix = "discount-ruleset-bundle:";
  private readonly metadataKeyPrefix = "discount-ruleset-metadata:";

  constructor(
    redisStoreService: RedisStoreService,
    private readonly versionManager: RulesetVersionManager,
    private readonly eligibilityBuilder: DiscountEligibilityBuilder,
    private readonly eligibilityStore: EligibilityStore,
    private readonly productMappingBuilder: ProductMappingBuilder,
    private readonly logger: PinoLogger,
    private readonly productMappingStore: ProductMappingStore,
    private readonly contextService: ContextService,
  ) {
    this.redisStoreService = redisStoreService;
  }

  async onModuleInit() {
    this.client = await this.redisStoreService.getClient();
  }

  /**
   * Build a new ruleset bundle from database
   * This is the core hot-reload operation
   */
  async buildBundle(
    discounts: DiscountResponseDto[],
  ): Promise<RulesetBundleMetadata> {
    const startTime = Date.now();

    try {
      // STEP 1: Build eligibility sets
      this.logger.debug(
        createLogContext(this.contextService, "buildBundle", {
          discountCount: discounts.length,
        }),
        "Building eligibility sets",
      );
      const eligibilityMap =
        await this.eligibilityBuilder.buildEligibilityForDiscounts(discounts);

      // STEP 2: Build product mappings
      this.logger.debug(
        createLogContext(this.contextService, "buildBundle", {
          discountCount: discounts.length,
        }),
        "Building product mappings",
      );
      const productIds = new Set<string>();
      for (const discount of discounts) {
        if (discount.productIds?.length) {
          for (const productId of discount.productIds) {
            productIds.add(productId);
          }
        }
      }
      const productMappings =
        productIds.size > 0
          ? await this.productMappingBuilder.buildMappingsBatch(
              Array.from(productIds),
            )
          : new Map<string, ProductMapping>();

      // STEP 3: Compute rule hash
      const ruleHash = computeRuleHash(discounts);

      // STEP 4: Get new version (but don't increment yet - atomic swap happens later)
      const currentVersion = await this.versionManager.getCurrentVersion();
      const newVersion = currentVersion + 1;

      // STEP 5: Serialize bundle
      const bundle: RulesetBundle = {
        version: newVersion,
        rules: discounts,
        metadata: {
          version: newVersion,
          rulesCount: discounts.length,
          bundleSizeKB: 0, // Will calculate after serialization
          ruleHash,
          createdAt: new Date().toISOString(),
          eligibilitySetsCount: eligibilityMap.size,
          productMappingsCount: productMappings.size,
        },
      };

      const serialized = JSON.stringify(bundle);
      const bundleSizeKB = Buffer.byteLength(serialized, "utf8") / 1024;
      bundle.metadata.bundleSizeKB = parseFloat(bundleSizeKB.toFixed(2));

      // STEP 6: Store bundle with version suffix (atomic write)
      const bundleKey = `${this.bundleKeyPrefix}${newVersion}`;
      const metadataKey = `${this.metadataKeyPrefix}${newVersion}`;

      await this.client.set(bundleKey, serialized);
      await this.client.set(metadataKey, JSON.stringify(bundle.metadata));

      // STEP 7: Store eligibility sets (non-blocking, continue on error)
      for (const [discountId, variantIds] of eligibilityMap.entries()) {
        try {
          await this.eligibilityStore.storeEligibility(discountId, variantIds);
        } catch (error) {
          this.logger.warn(
            createErrorContext(this.contextService, "buildBundle", error, {
              discountId,
            }),
            "Failed to store eligibility for discount",
          );
        }
      }

      // STEP 8: Store product mappings (non-blocking, continue on error)
      for (const [productId, mapping] of productMappings.entries()) {
        try {
          await this.productMappingStore.storeProductMapping(
            productId,
            mapping,
          );
        } catch (error) {
          this.logger.warn(
            createErrorContext(this.contextService, "buildBundle", error, {
              productId,
            }),
            "Failed to store product mapping for product",
          );
        }
      }

      const buildTime = Date.now() - startTime;
      this.logger.info(
        createLogContext(this.contextService, "buildBundle", {
          version: newVersion,
          buildTimeMs: buildTime,
          rulesCount: discounts.length,
          bundleSizeKB: parseFloat(bundleSizeKB.toFixed(2)),
        }),
        "Built ruleset bundle",
      );

      return bundle.metadata;
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "buildBundle", error, {
          discountCount: discounts.length,
        }),
        "Failed to build ruleset bundle",
      );
      throw error;
    }
  }

  /**
   * Activate a new bundle version (atomic swap)
   * This is the critical operation that makes hot reload atomic
   */
  async activateBundle(version: number): Promise<void> {
    try {
      // Verify bundle exists
      const bundleKey = `${this.bundleKeyPrefix}${version}`;
      const exists = await this.client.exists(bundleKey);
      if (!exists) {
        throw new Error(`Bundle v${version} does not exist`);
      }

      // Atomically increment version (this activates the bundle)
      const newVersion = await this.versionManager.incrementVersion();

      if (newVersion !== version) {
        throw new Error(
          `Version mismatch: expected ${version}, got ${newVersion}. Another process may have updated the version.`,
        );
      }

      this.logger.info(
        createLogContext(this.contextService, "activateBundle", { version }),
        "Activated ruleset bundle",
      );
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "activateBundle", error, {
          version,
        }),
        "Failed to activate bundle",
      );
      throw error;
    }
  }

  /**
   * Get bundle for a specific version
   */
  async getBundle(version: number): Promise<RulesetBundle | null> {
    try {
      const bundleKey = `${this.bundleKeyPrefix}${version}`;
      const bundleStr = await this.client.get(bundleKey);
      if (!bundleStr) {
        return null;
      }
      return JSON.parse(bundleStr) as RulesetBundle;
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "getBundle", error, {
          version,
        }),
        "Failed to get bundle",
      );
      return null;
    }
  }

  /**
   * Get current active bundle (uses current version)
   */
  async getCurrentBundle(): Promise<RulesetBundle | null> {
    try {
      const version = await this.versionManager.getCurrentVersion();
      return this.getBundle(version);
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "getCurrentBundle", error),
        "Failed to get current bundle",
      );
      return null;
    }
  }

  /**
   * Get bundle metadata
   */
  async getBundleMetadata(
    version: number,
  ): Promise<RulesetBundleMetadata | null> {
    try {
      const metadataKey = `${this.metadataKeyPrefix}${version}`;
      const metadataStr = await this.client.get(metadataKey);
      if (!metadataStr) {
        return null;
      }
      return JSON.parse(metadataStr) as RulesetBundleMetadata;
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "getBundleMetadata", error, {
          version,
        }),
        "Failed to get bundle metadata",
      );
      return null;
    }
  }

  /**
   * Validate bundle integrity
   * Checks required fields, rule hash, and bundle size limits
   */
  validateBundle(bundle: RulesetBundle): boolean {
    if (!bundle || !bundle.rules || !bundle.metadata) {
      this.logger.error(
        createLogContext(this.contextService, "validateBundle", {
          hasBundle: !!bundle,
        }),
        "Bundle missing required fields",
      );
      return false;
    }

    // Check version consistency
    if (bundle.version !== bundle.metadata.version) {
      this.logger.error(
        createLogContext(this.contextService, "validateBundle", {
          bundleVersion: bundle.version,
          metadataVersion: bundle.metadata.version,
        }),
        "Bundle version mismatch",
      );
      return false;
    }

    // Check rules count consistency
    if (bundle.rules.length !== bundle.metadata.rulesCount) {
      this.logger.error(
        `Bundle rules count mismatch: ${bundle.rules.length} vs ${bundle.metadata.rulesCount}`,
      );
      return false;
    }

    // Validate rule hash
    const computedHash = computeRuleHash(bundle.rules);
    if (bundle.metadata.ruleHash !== computedHash) {
      this.logger.error(
        `Bundle rule hash mismatch: ${bundle.metadata.ruleHash} vs ${computedHash}`,
      );
      return false;
    }

    // Check bundle size limits (prevent extremely large bundles)
    const MAX_BUNDLE_SIZE_KB = 1024; // 1MB limit
    if (bundle.metadata.bundleSizeKB > MAX_BUNDLE_SIZE_KB) {
      this.logger.error(
        `Bundle size exceeds limit: ${bundle.metadata.bundleSizeKB}KB > ${MAX_BUNDLE_SIZE_KB}KB`,
      );
      return false;
    }

    // Validate metadata fields
    if (!bundle.metadata.createdAt || !bundle.metadata.ruleHash) {
      this.logger.error(
        createLogContext(this.contextService, "validateBundle", {
          hasCreatedAt: !!bundle.metadata.createdAt,
          hasRuleHash: !!bundle.metadata.ruleHash,
        }),
        "Bundle metadata missing required fields",
      );
      return false;
    }

    return true;
  }

  /**
   * Cleanup old bundle versions (keep last N versions)
   */
  async cleanupOldBundles(keepVersions = 10): Promise<void> {
    try {
      const currentVersion = await this.versionManager.getCurrentVersion();
      const keys = await this.client.keys(`${this.bundleKeyPrefix}*`);
      const versions = keys
        .map((key) => {
          const match = key.match(/discount-ruleset-bundle:(\d+)/);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter((v): v is number => v !== null)
        .sort((a, b) => b - a); // Sort descending

      // Keep current version and last N versions
      const versionsToKeep = new Set(
        versions.slice(0, keepVersions).concat([currentVersion]),
      );

      // Delete old versions
      for (const version of versions) {
        if (!versionsToKeep.has(version)) {
          const bundleKey = `${this.bundleKeyPrefix}${version}`;
          const metadataKey = `${this.metadataKeyPrefix}${version}`;
          await this.client.del(bundleKey, metadataKey);
          this.logger.debug(
            createLogContext(this.contextService, "cleanupOldBundles", {
              version,
            }),
            "Cleaned up old bundle",
          );
        }
      }
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "cleanupOldBundles", error),
        "Failed to cleanup old bundles",
      );
      // Don't throw - cleanup failures shouldn't break the system
    }
  }
}
