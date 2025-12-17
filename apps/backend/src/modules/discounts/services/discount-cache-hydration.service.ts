import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { DiscountRuleStore } from "../../redis-store/stores/discount-rule-store";
import { EligibilityStore } from "../../redis-store/stores/eligibility-store";
import { ProductMappingStore } from "../../redis-store/stores/product-mapping-store";
import { DiscountsService } from "../discounts.service";
import { DiscountEligibilityBuilder } from "./discount-eligibility-builder.service";
import { ProductMappingBuilder } from "./product-mapping-builder.service";
import { RulesetRebuilder } from "./ruleset-rebuilder.service";
import { RulesetVersionManager } from "./ruleset-version-manager.service";

@Injectable()
export class DiscountCacheHydrationService implements OnModuleInit {
  private readonly logger = new Logger(DiscountCacheHydrationService.name);

  constructor(
    private readonly discountsService: DiscountsService,
    private readonly discountRuleStore: DiscountRuleStore,
    private readonly eligibilityStore: EligibilityStore,
    private readonly eligibilityBuilder: DiscountEligibilityBuilder,
    private readonly productMappingStore: ProductMappingStore,
    private readonly productMappingBuilder: ProductMappingBuilder,
    private readonly rulesetRebuilder: RulesetRebuilder,
    private readonly versionManager: RulesetVersionManager,
  ) {}

  /**
   * Bootstrap Redis caches on app startup
   */
  async onModuleInit() {
    this.logger.log("Starting discount cache hydration...");
    try {
      await this.hydrate();
      this.logger.log("Discount cache hydration completed successfully");
    } catch (error) {
      // Don't block startup if hydration fails
      this.logger.error(
        `Failed to hydrate discount caches on startup: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error.stack : undefined,
      );
      this.logger.warn(
        "Continuing startup without discount cache hydration. System will fallback to DB queries.",
      );
    }
  }

  /**
   * Hydrate all discount caches
   */
  async hydrate(): Promise<void> {
    this.logger.log("Hydrating discount caches...");

    // STEP 1: Initialize version if not exists
    try {
      const currentVersion = await this.versionManager.getCurrentVersion();
      this.logger.log(`Current ruleset version: ${currentVersion}`);
    } catch (_error) {
      // Version will be initialized by versionManager if not exists
      this.logger.debug(
        "Version not initialized yet, will be created on first bundle",
      );
    }

    // STEP 2: Rebuild bundle from DB (this creates versioned bundle with eligibility + mappings)
    try {
      const newVersion = await this.rulesetRebuilder.rebuildFromDb();
      this.logger.log(
        `Successfully hydrated discount caches with bundle v${newVersion}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to rebuild bundle during hydration: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      // Fallback to old method for backward compatibility
      this.logger.warn("Falling back to legacy cache hydration method");
      await this.hydrateLegacy();
    }

    this.logger.log("Discount cache hydration completed");
  }

  /**
   * Legacy hydration method (fallback)
   */
  private async hydrateLegacy(): Promise<void> {
    // Load all active discounts from DB
    const allDiscounts = await this.loadActiveDiscountsFromDb();
    this.logger.log(`Loaded ${allDiscounts.length} active discounts from DB`);

    if (allDiscounts.length === 0) {
      this.logger.log("No active discounts found, skipping cache hydration");
      return;
    }

    // Store discount rules in Redis (legacy key)
    await this.discountRuleStore.storeRules(allDiscounts);
    this.logger.log("Stored discount rules in Redis (legacy)");

    // Build and store eligibility sets
    await this.hydrateEligibilitySets(allDiscounts);
    this.logger.log("Hydrated eligibility sets");

    // Build and store product mappings
    await this.hydrateProductMappings(allDiscounts);
    this.logger.log("Hydrated product mappings");
  }

  /**
   * Load active discounts from database
   */
  private async loadActiveDiscountsFromDb() {
    // Get all discounts and enrich with relations
    const discounts = await this.discountsService.findAllUnpaginated();
    const now = new Date();
    return discounts.filter((d) => {
      if (!d.isActive) {
        return false;
      }
      if (d.startDate > now) {
        return false; // Not started yet
      }
      if (d.endDate && d.endDate < now) {
        return false; // Expired
      }
      return true;
    });
  }

  /**
   * Hydrate eligibility sets for all discounts
   */
  // biome-ignore lint/suspicious/noExplicitAny: DiscountResponseDto[] type
  private async hydrateEligibilitySets(discounts: any[]): Promise<void> {
    const eligibilityMap =
      await this.eligibilityBuilder.buildEligibilityForDiscounts(discounts);

    for (const [discountId, variantIds] of eligibilityMap.entries()) {
      try {
        await this.eligibilityStore.storeEligibility(discountId, variantIds);
      } catch (error) {
        this.logger.error(
          `Failed to store eligibility for discount ${discountId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        // Continue with other discounts
      }
    }
  }

  /**
   * Hydrate product mappings for products referenced in discounts
   */
  // biome-ignore lint/suspicious/noExplicitAny: DiscountResponseDto[] type
  private async hydrateProductMappings(discounts: any[]): Promise<void> {
    // Collect all unique product IDs from discounts
    const productIds = new Set<string>();

    for (const discount of discounts) {
      if (discount.productIds && discount.productIds.length > 0) {
        for (const productId of discount.productIds) {
          productIds.add(productId);
        }
      }
    }

    if (productIds.size === 0) {
      return;
    }

    // Build mappings in batch
    const mappings = await this.productMappingBuilder.buildMappingsBatch(
      Array.from(productIds),
    );

    // Store mappings
    for (const [productId, mapping] of mappings.entries()) {
      try {
        await this.productMappingStore.storeProductMapping(productId, mapping);
      } catch (error) {
        this.logger.error(
          `Failed to store product mapping for product ${productId}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        // Continue with other products
      }
    }
  }
}
