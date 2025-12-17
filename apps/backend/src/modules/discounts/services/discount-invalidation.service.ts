import { Injectable, Logger } from "@nestjs/common";
import { DiscountRuleStore } from "../../redis-store/stores/discount-rule-store";
import { EligibilityStore } from "../../redis-store/stores/eligibility-store";
import { ProductMappingStore } from "../../redis-store/stores/product-mapping-store";
import { RulesetRebuilder } from "./ruleset-rebuilder.service";

@Injectable()
export class DiscountInvalidationService {
  private readonly logger = new Logger(DiscountInvalidationService.name);

  constructor(
    private readonly discountRuleStore: DiscountRuleStore,
    private readonly eligibilityStore: EligibilityStore,
    private readonly productMappingStore: ProductMappingStore,
    private readonly rulesetRebuilder: RulesetRebuilder,
  ) {}

  /**
   * Invalidate discount cache (on discount update/delete)
   * Triggers hot reload to rebuild bundle atomically
   */
  async invalidateDiscount(discountId: string): Promise<void> {
    try {
      // Invalidate eligibility set (individual discount)
      await this.eligibilityStore.invalidateEligibility(discountId);

      // Trigger hot reload to rebuild bundle with updated discounts
      try {
        const newVersion = await this.rulesetRebuilder.rebuildFromDb();
        this.logger.log(
          `Hot reload triggered for discount ${discountId}, new version: ${newVersion}`,
        );
      } catch (rebuildError) {
        // Fallback to legacy invalidation if rebuild fails
        this.logger.warn(
          `Hot reload failed for discount ${discountId}, falling back to legacy invalidation: ${rebuildError instanceof Error ? rebuildError.message : "Unknown error"}`,
        );
        await this.discountRuleStore.invalidateRules();
      }

      this.logger.debug(`Invalidated cache for discount ${discountId}`);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate discount ${discountId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Invalidate product-related caches (on product update)
   * Triggers hot reload to rebuild bundle atomically
   */
  async invalidateProduct(productId: string): Promise<void> {
    try {
      // Invalidate product mapping (individual product)
      await this.productMappingStore.invalidateProductMapping(productId);

      // Trigger hot reload (product changes affect eligibility)
      try {
        const newVersion = await this.rulesetRebuilder.rebuildFromDb();
        this.logger.log(
          `Hot reload triggered for product ${productId}, new version: ${newVersion}`,
        );
      } catch (rebuildError) {
        this.logger.warn(
          `Hot reload failed for product ${productId}, falling back to legacy invalidation: ${rebuildError instanceof Error ? rebuildError.message : "Unknown error"}`,
        );
        await this.discountRuleStore.invalidateRules();
      }

      this.logger.debug(`Invalidated cache for product ${productId}`);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate product ${productId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Invalidate variant-related caches (on variant update)
   * Triggers hot reload to rebuild bundle atomically
   */
  async invalidateVariant(variantId: string): Promise<void> {
    try {
      // Invalidate variant mapping (individual variant)
      await this.productMappingStore.invalidateVariantMapping(variantId);

      // Trigger hot reload (variant changes affect eligibility)
      try {
        const newVersion = await this.rulesetRebuilder.rebuildFromDb();
        this.logger.log(
          `Hot reload triggered for variant ${variantId}, new version: ${newVersion}`,
        );
      } catch (rebuildError) {
        this.logger.warn(
          `Hot reload failed for variant ${variantId}, falling back to legacy invalidation: ${rebuildError instanceof Error ? rebuildError.message : "Unknown error"}`,
        );
        await this.discountRuleStore.invalidateRules();
      }

      this.logger.debug(`Invalidated cache for variant ${variantId}`);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate variant ${variantId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Invalidate collection-related caches (on collection change)
   * Triggers hot reload to rebuild bundle atomically
   */
  async invalidateCollection(collectionId: string): Promise<void> {
    try {
      // Trigger hot reload (collection changes affect eligibility)
      try {
        const newVersion = await this.rulesetRebuilder.rebuildFromDb();
        this.logger.log(
          `Hot reload triggered for collection ${collectionId}, new version: ${newVersion}`,
        );
      } catch (rebuildError) {
        this.logger.warn(
          `Hot reload failed for collection ${collectionId}, falling back to legacy invalidation: ${rebuildError instanceof Error ? rebuildError.message : "Unknown error"}`,
        );
        await this.discountRuleStore.invalidateRules();
      }

      this.logger.debug(`Invalidated cache for collection ${collectionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate collection ${collectionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Invalidate tag-related caches (on tag assignment change)
   * Triggers hot reload to rebuild bundle atomically
   */
  async invalidateTag(tagId: string): Promise<void> {
    try {
      // Trigger hot reload (tag changes affect eligibility)
      try {
        const newVersion = await this.rulesetRebuilder.rebuildFromDb();
        this.logger.log(
          `Hot reload triggered for tag ${tagId}, new version: ${newVersion}`,
        );
      } catch (rebuildError) {
        this.logger.warn(
          `Hot reload failed for tag ${tagId}, falling back to legacy invalidation: ${rebuildError instanceof Error ? rebuildError.message : "Unknown error"}`,
        );
        await this.discountRuleStore.invalidateRules();
      }

      this.logger.debug(`Invalidated cache for tag ${tagId}`);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate tag ${tagId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Force full cache refresh (admin endpoint)
   * Triggers hot reload to rebuild bundle atomically
   */
  async invalidateAll(): Promise<void> {
    try {
      // Trigger hot reload
      try {
        const newVersion = await this.rulesetRebuilder.rebuildFromDb();
        this.logger.log(
          `Hot reload triggered for all discounts, new version: ${newVersion}`,
        );
      } catch (rebuildError) {
        this.logger.warn(
          `Hot reload failed, falling back to legacy invalidation: ${rebuildError instanceof Error ? rebuildError.message : "Unknown error"}`,
        );
        await this.discountRuleStore.invalidateRules();
      }
    } catch (error) {
      this.logger.error(
        `Failed to invalidate all caches: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }
}
