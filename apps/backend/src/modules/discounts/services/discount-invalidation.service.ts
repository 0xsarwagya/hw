import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../../../common/logging/logging.helper";
import { DiscountRuleStore } from "../../redis-store/stores/discount-rule-store";
import { EligibilityStore } from "../../redis-store/stores/eligibility-store";
import { ProductMappingStore } from "../../redis-store/stores/product-mapping-store";
import { RulesetRebuilder } from "./ruleset-rebuilder.service";

@Injectable()
export class DiscountInvalidationService {
  constructor(
    private readonly discountRuleStore: DiscountRuleStore,
    private readonly eligibilityStore: EligibilityStore,
    private readonly productMappingStore: ProductMappingStore,
    private readonly rulesetRebuilder: RulesetRebuilder,
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
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
        this.logger.info(
          createLogContext(this.contextService, "invalidateDiscount", {
            discountId,
            version: newVersion,
          }),
          "Hot reload triggered for discount",
        );
      } catch (rebuildError) {
        // Fallback to legacy invalidation if rebuild fails
        this.logger.warn(
          createErrorContext(
            this.contextService,
            "invalidateDiscount",
            rebuildError,
            { discountId },
          ),
          "Hot reload failed for discount, falling back to legacy invalidation",
        );
        await this.discountRuleStore.invalidateRules();
      }

      this.logger.debug(
        createLogContext(this.contextService, "invalidateDiscount", {
          discountId,
        }),
        "Invalidated cache for discount",
      );
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "invalidateDiscount", error, {
          discountId,
        }),
        "Failed to invalidate discount",
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
        this.logger.info(
          createLogContext(this.contextService, "invalidateProduct", {
            productId,
            version: newVersion,
          }),
          "Hot reload triggered for product",
        );
      } catch (rebuildError) {
        this.logger.warn(
          createErrorContext(
            this.contextService,
            "invalidateProduct",
            rebuildError,
            { productId },
          ),
          "Hot reload failed for product, falling back to legacy invalidation",
        );
        await this.discountRuleStore.invalidateRules();
      }

      this.logger.debug(
        createLogContext(this.contextService, "invalidateProduct", {
          productId,
        }),
        "Invalidated cache for product",
      );
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "invalidateProduct", error, {
          productId,
        }),
        "Failed to invalidate product",
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
        this.logger.info(
          createLogContext(this.contextService, "invalidateVariant", {
            variantId,
            version: newVersion,
          }),
          "Hot reload triggered for variant",
        );
      } catch (rebuildError) {
        this.logger.warn(
          createErrorContext(
            this.contextService,
            "invalidateVariant",
            rebuildError,
            { variantId },
          ),
          "Hot reload failed for variant, falling back to legacy invalidation",
        );
        await this.discountRuleStore.invalidateRules();
      }

      this.logger.debug(
        createLogContext(this.contextService, "invalidateVariant", {
          variantId,
        }),
        "Invalidated cache for variant",
      );
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "invalidateVariant", error, {
          variantId,
        }),
        "Failed to invalidate variant",
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
        this.logger.info(
          createLogContext(this.contextService, "invalidateCollection", {
            collectionId,
            version: newVersion,
          }),
          "Hot reload triggered for collection",
        );
      } catch (rebuildError) {
        this.logger.warn(
          createErrorContext(
            this.contextService,
            "invalidateCollection",
            rebuildError,
            { collectionId },
          ),
          "Hot reload failed for collection, falling back to legacy invalidation",
        );
        await this.discountRuleStore.invalidateRules();
      }

      this.logger.debug(
        createLogContext(this.contextService, "invalidateCollection", {
          collectionId,
        }),
        "Invalidated cache for collection",
      );
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "invalidateCollection", error, {
          collectionId,
        }),
        "Failed to invalidate collection",
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
        this.logger.info(
          createLogContext(this.contextService, "invalidateTag", {
            tagId,
            version: newVersion,
          }),
          "Hot reload triggered for tag",
        );
      } catch (rebuildError) {
        this.logger.warn(
          createErrorContext(
            this.contextService,
            "invalidateTag",
            rebuildError,
            { tagId },
          ),
          "Hot reload failed for tag, falling back to legacy invalidation",
        );
        await this.discountRuleStore.invalidateRules();
      }

      this.logger.debug(
        createLogContext(this.contextService, "invalidateTag", { tagId }),
        "Invalidated cache for tag",
      );
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "invalidateTag", error, {
          tagId,
        }),
        "Failed to invalidate tag",
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
        this.logger.info(
          createLogContext(this.contextService, "invalidateAll", {
            version: newVersion,
          }),
          "Hot reload triggered for all discounts",
        );
      } catch (rebuildError) {
        this.logger.warn(
          createErrorContext(
            this.contextService,
            "invalidateAll",
            rebuildError,
          ),
          "Hot reload failed, falling back to legacy invalidation",
        );
        await this.discountRuleStore.invalidateRules();
      }
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "invalidateAll", error),
        "Failed to invalidate all caches",
      );
      throw error;
    }
  }
}
