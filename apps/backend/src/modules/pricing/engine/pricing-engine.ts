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
 * Check if sale is active
 */
function isSaleActive(variant: VariantPricingInput, now: Date): boolean {
  if (variant.salePrice === undefined) {
    return false;
  }

  if (variant.saleStartDate && new Date(variant.saleStartDate) > now) {
    return false;
  }

  if (variant.saleEndDate && new Date(variant.saleEndDate) < now) {
    return false;
  }

  return true;
}

/**
 * Resolve price list overrides for a variant
 */
function resolvePriceListOverrides(
  variant: VariantPricingInput,
  priceLists: PriceList[],
): PriceListOverride[] {
  const overrides: PriceListOverride[] = [];

  for (const priceList of priceLists) {
    for (const item of priceList.items) {
      // Check variant-specific override (most specific)
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

      // Check product-level override
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

      // Check category-level override (least specific)
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
 * Takes variants, customer, and price lists, returns effective prices
 * Deterministic: same input → same output
 */
export function runPricingEngine(
  input: PricingEngineInput,
): PricingEngineResult {
  // Validate input
  const validVariants = validatePricingInput(input);
  const { priceLists, now } = input;

  const variantPrices: VariantPricingResult[] = [];
  let totalBasePrice = 0;
  let totalEffectivePrice = 0;
  const appliedPriceListIds = new Set<string>();

  // Process each variant
  for (const variant of validVariants) {
    // STEP 1: Resolve price list overrides (most specific wins)
    const overrides = resolvePriceListOverrides(variant, priceLists);
    const bestOverride = overrides.length > 0 ? overrides[0] : null;

    // STEP 2: Calculate price after override
    let priceAfterOverride = variant.basePrice;
    if (bestOverride) {
      if (bestOverride.overrideType === "FIXED") {
        priceAfterOverride = bestOverride.overrideValue;
      } else if (bestOverride.overrideType === "PERCENTAGE") {
        priceAfterOverride =
          variant.basePrice * (1 - bestOverride.overrideValue / 100);
      }
      appliedPriceListIds.add(bestOverride.priceListId);
    }

    // STEP 3: Apply scheduled sale price (if active)
    const saleActive = isSaleActive(variant, now);
    const effectivePrice =
      saleActive && variant.salePrice !== undefined
        ? Math.max(0, roundToTwoDecimals(variant.salePrice))
        : Math.max(0, roundToTwoDecimals(priceAfterOverride));

    // STEP 4: Build result
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
