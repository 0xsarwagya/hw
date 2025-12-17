import { Injectable, Logger } from "@nestjs/common";
import { BundleCacheStore } from "../../redis-store/stores/bundle-cache-store";
import { BundleDefinitionService } from "./bundle-definition.service";

/**
 * Service for warming up bundle cache in Redis
 */
@Injectable()
export class BundleWarmupService {
  private readonly logger = new Logger(BundleWarmupService.name);

  constructor(
    private readonly bundleDefinitionService: BundleDefinitionService,
    private readonly bundleCacheStore: BundleCacheStore,
  ) {}

  /**
   * Warm up cache for a specific bundle
   */
  async warmupBundle(bundleId: string): Promise<void> {
    try {
      this.logger.log(`Warming up bundle cache for bundle ${bundleId}`);

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

      this.logger.log(
        `Successfully warmed up cache for bundle ${bundleId} with ${bundle.sets.length} sets`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to warm up bundle cache for ${bundleId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Warm up cache for all active bundles
   */
  async warmupAllBundles(): Promise<void> {
    try {
      this.logger.log("Warming up cache for all active bundles");

      // Get all active bundles
      const bundles = await this.bundleDefinitionService.findAll();
      const activeBundles = bundles.data.filter((b) => b.isActive);

      this.logger.log(
        `Found ${activeBundles.length} active bundles to warm up`,
      );

      // Warm up each bundle
      for (const bundle of activeBundles) {
        try {
          await this.warmupBundle(bundle.id);
        } catch (error) {
          this.logger.warn(
            `Failed to warm up bundle ${bundle.id}, continuing with others: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          // Continue with other bundles even if one fails
        }
      }

      this.logger.log(
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
