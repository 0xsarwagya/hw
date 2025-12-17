import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { RedisStoreService } from "../../redis-store/redis-store.service";
import { PriceList } from "../engine/pricing-engine.types";
import { computePriceListHash } from "../engine/pricing-hash.utils";
import { CustomerGroupService } from "./customer-group.service";
import { PricingVersionManager } from "./pricing-version-manager.service";

/**
 * Pricing bundle metadata
 */
export interface PricingBundleMetadata {
  version: number;
  variantCount: number;
  priceListCount: number;
  groupCount: number;
  bundleSizeKB: number;
  ruleHash: string;
  createdAt: string;
}

/**
 * Complete pricing bundle including variants, price lists, and customer groups
 */
export interface PricingBundle {
  version: number;
  variants: Map<
    string,
    {
      variantId: string;
      productId: string;
      categoryId: string | null;
      basePrice: number;
      compareAtPrice?: number;
      currency: string;
      salePrice?: number;
      saleStartDate?: Date;
      saleEndDate?: Date;
    }
  >;
  priceLists: PriceList[];
  customerGroups: Map<string, Array<{ priceListId: string; priority: number }>>;
  metadata: PricingBundleMetadata;
}

@Injectable()
export class PricingBundleService implements OnModuleInit {
  private readonly logger = new Logger(PricingBundleService.name);
  private client!: Redis;
  private readonly redisStoreService: RedisStoreService;
  private readonly bundleKeyPrefix = "pricing-ruleset-bundle:";
  private readonly metadataKeyPrefix = "pricing-ruleset-metadata:";

  constructor(
    redisStoreService: RedisStoreService,
    private readonly versionManager: PricingVersionManager,
    readonly customerGroupService: CustomerGroupService,
  ) {
    this.redisStoreService = redisStoreService;
  }

  async onModuleInit() {
    this.client = this.redisStoreService.getClient();
  }

  /**
   * Build a new pricing bundle from database
   */
  async buildBundle(
    variants: Array<{
      variantId: string;
      productId: string;
      categoryId: string | null;
      basePrice: number;
      compareAtPrice?: number;
      currency: string;
      salePrice?: number;
      saleStartDate?: Date;
      saleEndDate?: Date;
    }>,
    priceLists: PriceList[],
  ): Promise<PricingBundleMetadata> {
    const startTime = Date.now();

    try {
      // STEP 1: Load customer groups and their price list mappings
      const customerGroups = await this.customerGroupService.findAll();
      const groupPriceListMap = new Map<
        string,
        Array<{ priceListId: string; priority: number }>
      >();

      for (const group of customerGroups) {
        groupPriceListMap.set(group.id, group.priceLists);
      }

      // STEP 2: Compute rule hash
      const ruleHash = computePriceListHash(priceLists);

      // STEP 3: Get new version (but don't increment yet - atomic swap happens later)
      const currentVersion = await this.versionManager.getCurrentVersion();
      const newVersion = currentVersion + 1;

      // STEP 4: Build variant map
      const variantMap = new Map<string, (typeof variants)[0]>();
      for (const variant of variants) {
        variantMap.set(variant.variantId, variant);
      }

      // STEP 5: Serialize bundle
      const bundle: PricingBundle = {
        version: newVersion,
        variants: variantMap,
        priceLists,
        customerGroups: groupPriceListMap,
        metadata: {
          version: newVersion,
          variantCount: variants.length,
          priceListCount: priceLists.length,
          groupCount: customerGroups.length,
          bundleSizeKB: 0, // Will calculate after serialization
          ruleHash,
          createdAt: new Date().toISOString(),
        },
      };

      // Convert Maps to arrays for JSON serialization
      const serializableBundle = {
        ...bundle,
        variants: Array.from(variantMap.entries()),
        customerGroups: Array.from(groupPriceListMap.entries()),
      };

      const serialized = JSON.stringify(serializableBundle);
      const bundleSizeKB = Buffer.byteLength(serialized, "utf8") / 1024;
      bundle.metadata.bundleSizeKB = parseFloat(bundleSizeKB.toFixed(2));

      // STEP 6: Store bundle with version suffix (atomic write)
      const bundleKey = `${this.bundleKeyPrefix}${newVersion}`;
      const metadataKey = `${this.metadataKeyPrefix}${newVersion}`;

      await this.client.set(bundleKey, serialized);
      await this.client.set(metadataKey, JSON.stringify(bundle.metadata));

      const buildTime = Date.now() - startTime;
      this.logger.log(
        `Built pricing bundle v${newVersion} in ${buildTime}ms (${variants.length} variants, ${priceLists.length} price lists, ${bundleSizeKB.toFixed(2)}KB)`,
      );

      return bundle.metadata;
    } catch (error) {
      this.logger.error(
        `Failed to build pricing bundle: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Activate a new bundle version (atomic swap)
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

      this.logger.log(`Activated pricing bundle v${version}`);
    } catch (error) {
      this.logger.error(
        `Failed to activate bundle v${version}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get bundle for a specific version
   */
  async getBundle(version: number): Promise<PricingBundle | null> {
    try {
      const bundleKey = `${this.bundleKeyPrefix}${version}`;
      const bundleStr = await this.client.get(bundleKey);
      if (!bundleStr) {
        return null;
      }
      const deserialized = JSON.parse(bundleStr) as {
        version: number;
        // biome-ignore lint/suspicious/noExplicitAny: Variant data structure from Redis
        variants: Array<[string, any]>;
        priceLists: PriceList[];
        customerGroups: Array<
          [string, Array<{ priceListId: string; priority: number }>]
        >;
        metadata: PricingBundleMetadata;
      };

      // Reconstruct Maps
      return {
        ...deserialized,
        variants: new Map(deserialized.variants),
        customerGroups: new Map(deserialized.customerGroups),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get bundle v${version}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null;
    }
  }

  /**
   * Get current active bundle (uses current version)
   */
  async getCurrentBundle(): Promise<PricingBundle | null> {
    try {
      const version = await this.versionManager.getCurrentVersion();
      return this.getBundle(version);
    } catch (error) {
      this.logger.error(
        `Failed to get current bundle: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null;
    }
  }

  /**
   * Get bundle metadata
   */
  async getBundleMetadata(
    version: number,
  ): Promise<PricingBundleMetadata | null> {
    try {
      const metadataKey = `${this.metadataKeyPrefix}${version}`;
      const metadataStr = await this.client.get(metadataKey);
      if (!metadataStr) {
        return null;
      }
      return JSON.parse(metadataStr) as PricingBundleMetadata;
    } catch (error) {
      this.logger.error(
        `Failed to get bundle metadata v${version}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null;
    }
  }

  /**
   * Validate bundle integrity
   */
  validateBundle(bundle: PricingBundle): boolean {
    if (!bundle || !bundle.variants || !bundle.priceLists || !bundle.metadata) {
      this.logger.error("Bundle missing required fields");
      return false;
    }

    if (bundle.version !== bundle.metadata.version) {
      this.logger.error(
        `Bundle version mismatch: ${bundle.version} vs ${bundle.metadata.version}`,
      );
      return false;
    }

    if (bundle.variants.size !== bundle.metadata.variantCount) {
      this.logger.error(
        `Bundle variant count mismatch: ${bundle.variants.size} vs ${bundle.metadata.variantCount}`,
      );
      return false;
    }

    if (bundle.priceLists.length !== bundle.metadata.priceListCount) {
      this.logger.error(
        `Bundle price list count mismatch: ${bundle.priceLists.length} vs ${bundle.metadata.priceListCount}`,
      );
      return false;
    }

    // Validate rule hash
    const computedHash = computePriceListHash(bundle.priceLists);
    if (bundle.metadata.ruleHash !== computedHash) {
      this.logger.error(
        `Bundle rule hash mismatch: ${bundle.metadata.ruleHash} vs ${computedHash}`,
      );
      return false;
    }

    return true;
  }

  /**
   * Cleanup old bundles (keep last 5 versions)
   */
  async cleanupOldBundles(keepVersions = 5): Promise<void> {
    try {
      const currentVersion = await this.versionManager.getCurrentVersion();
      const versionsToKeep = new Set<number>();

      // Keep current version and previous N-1 versions
      for (let i = 0; i < keepVersions; i++) {
        const version = currentVersion - i;
        if (version > 0) {
          versionsToKeep.add(version);
        }
      }

      // Find all bundle keys
      const keys = await this.client.keys(`${this.bundleKeyPrefix}*`);
      const metadataKeys = await this.client.keys(`${this.metadataKeyPrefix}*`);

      let deleted = 0;
      for (const key of [...keys, ...metadataKeys]) {
        const versionMatch = key.match(/\d+$/);
        if (versionMatch) {
          const version = parseInt(versionMatch[0], 10);
          if (!versionsToKeep.has(version)) {
            await this.client.del(key);
            deleted++;
          }
        }
      }

      if (deleted > 0) {
        this.logger.log(`Cleaned up ${deleted} old pricing bundle(s)`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to cleanup old bundles: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
