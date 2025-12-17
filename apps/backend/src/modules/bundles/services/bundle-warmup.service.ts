import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../../../common/logging/logging.helper";
import { BundleCacheStore } from "../../redis-store/stores/bundle-cache-store";
import { BundleDefinitionService } from "./bundle-definition.service";

/**
 * Service for warming up bundle cache in Redis
 */
@Injectable()
export class BundleWarmupService {
  constructor(
    private readonly bundleDefinitionService: BundleDefinitionService,
    private readonly bundleCacheStore: BundleCacheStore,
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
  ) {}

  /**
   * Warm up cache for a specific bundle
   */
  async warmupBundle(bundleId: string): Promise<void> {
    try {
      this.logger.info(
        createLogContext(this.contextService, "warmupBundle", { bundleId }),
        "Warming up bundle cache",
      );

      // Get bundle definition with all sets and items
      const bundle = await this.bundleDefinitionService.findOne(bundleId);

      // Store bundle definition in Redis
      await this.bundleCacheStore.storeBundleDefinition(bundleId, bundle);

      // Store bundle sets
      await this.bundleCacheStore.storeBundleSets(bundleId, bundle.sets);

      // Store eligibility sets for each set (variant IDs allowed in each set)
      for (const set of bundle.sets) {
        const variantIds = set.items.map((item) => item.variantId);
        await this.bundleCacheStore.storeBundleEligibility(
          bundleId,
          set.id,
          variantIds,
        );
      }

      this.logger.info(
        createLogContext(this.contextService, "warmupBundle", {
          bundleId,
          setsCount: bundle.sets.length,
        }),
        "Successfully warmed up cache for bundle",
      );
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "warmupBundle", error, {
          bundleId,
        }),
        "Failed to warm up bundle cache",
      );
      throw error;
    }
  }

  /**
   * Warm up cache for all active bundles
   */
  async warmupAllBundles(): Promise<void> {
    try {
      this.logger.info(
        createLogContext(this.contextService, "warmupAllBundles", {}),
        "Warming up cache for all active bundles",
      );

      // Get all active bundles
      const bundles = await this.bundleDefinitionService.findAll();
      const activeBundles = bundles.data.filter((b) => b.isActive);

      this.logger.info(
        createLogContext(this.contextService, "warmupAllBundles", {
          activeBundleCount: activeBundles.length,
        }),
        "Found active bundles to warm up",
      );

      // Warm up each bundle
      for (const bundle of activeBundles) {
        try {
          await this.warmupBundle(bundle.id);
        } catch (error) {
          this.logger.warn(
            createErrorContext(this.contextService, "warmupAllBundles", error, {
              bundleId: bundle.id,
            }),
            "Failed to warm up bundle, continuing with others",
          );
          // Continue with other bundles even if one fails
        }
      }

      this.logger.info(
        `Completed warming up cache for ${activeBundles.length} bundles`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to warm up all bundles: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }
}
