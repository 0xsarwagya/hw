import {
  calculateEffectivePrice,
  calculatePriceAfterOverride,
} from "./pricing-calculation.helper";
import {
  PriceList,
  PriceListOverride,
  PricingEngineInput,
  PricingEngineResult,
  VariantPricingInput,
  VariantPricingResult,
} from "./pricing-engine.types";
import { validatePricingInput } from "./pricing-validator";

/**
 * Round to 2 decimal places
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Check if sale is active for a variant at the given date
 */
function isSaleActive(
  variant: VariantPricingInput,
  currentDate: Date,
): boolean {
  if (variant.salePrice === undefined) {
    return false;
  }

  if (variant.saleStartDate && new Date(variant.saleStartDate) > currentDate) {
    return false;
  }

  if (variant.saleEndDate && new Date(variant.saleEndDate) < currentDate) {
    return false;
  }

  return true;
}

/**
 * Resolve price list overrides for a variant
 *
 * Override priority (most specific wins):
 * 1. Variant-specific override (highest priority)
 * 2. Product-level override
 * 3. Category-level override (lowest priority)
 *
 * Multiple price lists can apply, but only the most specific override from
 * the highest priority price list is used.
 */
function resolvePriceListOverrides(
  variant: VariantPricingInput,
  priceLists: PriceList[],
): PriceListOverride[] {
  const overrides: PriceListOverride[] = [];

  for (const priceList of priceLists) {
    for (const item of priceList.items) {
      // Variant-specific override takes precedence (most specific match)
      if (item.productVariantId === variant.variantId) {
        overrides.push({
          priceListId: priceList.id,
          priceListName: priceList.name,
          priority: priceList.priority,
          overrideType: item.overrideType,
          overrideValue: item.overrideValue,
          specificity: "VARIANT",
        });
        continue;
      }

      // Product-level override (less specific than variant, but more than category)
      if (item.productId === variant.productId) {
        overrides.push({
          priceListId: priceList.id,
          priceListName: priceList.name,
          priority: priceList.priority,
          overrideType: item.overrideType,
          overrideValue: item.overrideValue,
          specificity: "PRODUCT",
        });
        continue;
      }

      // Category-level override (least specific - applies to all variants in category)
      if (
        item.categoryId &&
        variant.categoryId &&
        item.categoryId === variant.categoryId
      ) {
        overrides.push({
          priceListId: priceList.id,
          priceListName: priceList.name,
          priority: priceList.priority,
          overrideType: item.overrideType,
          overrideValue: item.overrideValue,
          specificity: "CATEGORY",
        });
      }
    }
  }

  return overrides;
}

/**
 * Pure pricing engine
 *
 * This is a deterministic function: same input → same output.
 * Never touches DB/Redis - all data must be pre-fetched.
 *
 * **Price calculation order:**
 * 1. Base price (from product variant)
 * 2. Price list override (customer-specific pricing)
 * 3. Sale price (if active and scheduled)
 *
 * Sale price takes precedence over price list overrides when active.
 * This ensures promotional sales are always honored, even for VIP customers.
 *
 * @param input - Pricing engine input containing:
 *   - `variants`: Array of product variants with base prices
 *   - `priceLists`: Customer-specific price lists with overrides
 *   - `now`: Current date for sale price validation
 * @returns Pricing result with:
 *   - `variantPrices`: Calculated prices for each variant
 *   - `totalBasePrice`: Sum of all base prices
 *   - `totalEffectivePrice`: Sum of all effective prices (after overrides/sales)
 *   - `totalSavings`: Difference between base and effective prices
 *   - `appliedPriceListIds`: IDs of price lists that were applied
 *
 * @example
 * ```typescript
 * const result = runPricingEngine({
 *   variants: [
 *     {
 *       variantId: "v1",
 *       productId: "p1",
 *       basePrice: 100,
 *       salePrice: 80,
 *       saleStartDate: new Date("2024-01-01"),
 *       saleEndDate: new Date("2024-12-31"),
 *     },
 *   ],
 *   priceLists: [
 *     {
 *       id: "pl1",
 *       name: "VIP Customers",
 *       priority: 1,
 *       items: [
 *         {
 *           productVariantId: "v1",
 *           overrideType: "PERCENTAGE",
 *           overrideValue: 20, // 20% off
 *         },
 *       ],
 *     },
 *   ],
 *   now: new Date("2024-06-01"),
 * });
 * // Sale price (80) takes precedence over price list override
 * ```
 */
export function runPricingEngine(
  input: PricingEngineInput,
): PricingEngineResult {
  // Filter out invalid variants (missing required fields)
  const validVariants = validatePricingInput(input);
  const { priceLists, now: currentDate } = input;

  const variantPrices: VariantPricingResult[] = [];
  let totalBasePrice = 0;
  let totalEffectivePrice = 0;
  const appliedPriceListIds = new Set<string>();

  // Process each variant independently
  for (const variant of validVariants) {
    // Resolve price list overrides (most specific match wins)
    // Overrides are sorted by specificity: variant > product > category
    const overrides = resolvePriceListOverrides(variant, priceLists);
    const bestOverride = overrides.length > 0 ? overrides[0] : null;

    // Calculate price after applying price list override
    // Override can be FIXED (set price) or PERCENTAGE (discount from base)
    const priceAfterOverride = calculatePriceAfterOverride(
      variant.basePrice,
      bestOverride,
    );

    if (bestOverride) {
      appliedPriceListIds.add(bestOverride.priceListId);
    }

    // Check if sale is active (within start/end date range)
    // Sale price takes precedence over price list overrides when active
    const saleActive = isSaleActive(variant, currentDate);
    const effectivePrice = calculateEffectivePrice(
      variant.basePrice,
      priceAfterOverride,
      variant.salePrice,
      saleActive,
    );

    // Build result with all pricing information for transparency
    variantPrices.push({
      variantId: variant.variantId,
      basePrice: variant.basePrice,
      compareAtPrice: variant.compareAtPrice,
      effectivePrice,
      appliedPriceListId: bestOverride?.priceListId,
      appliedPriceListName: bestOverride?.priceListName,
      salePrice: saleActive ? variant.salePrice : undefined,
      isOnSale: saleActive,
      priceListOverrides: overrides,
    });

    totalBasePrice += variant.basePrice;
    totalEffectivePrice += effectivePrice;
  }

  const totalSavings = totalBasePrice - totalEffectivePrice;

  return {
    variantPrices,
    totalBasePrice: roundToTwoDecimals(totalBasePrice),
    totalEffectivePrice: roundToTwoDecimals(totalEffectivePrice),
    totalSavings: roundToTwoDecimals(totalSavings),
    appliedPriceListIds: Array.from(appliedPriceListIds),
  };
}
