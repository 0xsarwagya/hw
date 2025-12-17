import {
  PricingEngineInput,
  VariantPricingInput,
} from "./pricing-engine.types";

/**
 * Validate pricing engine input
 * Safety net - parent service should pre-filter
 */
export function validatePricingInput(
  input: PricingEngineInput,
): VariantPricingInput[] {
  const { variants, priceLists, now } = input;
  const validVariants: VariantPricingInput[] = [];

  for (const variant of variants) {
    // Validate base price
    if (variant.basePrice < 0) {
      continue; // Skip invalid variant
    }

    // Validate sale price if present
    if (variant.salePrice !== undefined && variant.salePrice < 0) {
      continue; // Skip invalid variant
    }

    // Validate compare-at price if present
    if (
      variant.compareAtPrice !== undefined &&
      variant.compareAtPrice < variant.basePrice
    ) {
      // Compare-at should be >= base price
      continue;
    }

    // Validate sale date range
    if (variant.saleStartDate && variant.saleEndDate) {
      if (new Date(variant.saleStartDate) > new Date(variant.saleEndDate)) {
        continue; // Invalid date range
      }
    }

    validVariants.push(variant);
  }

  // Filter active price lists (validation only - filtering happens in engine)
  priceLists.filter((list) => {
    if (!list.isActive) {
      return false;
    }
    if (list.startDate && new Date(list.startDate) > now) {
      return false;
    }
    if (list.endDate && new Date(list.endDate) < now) {
      return false;
    }
    return true;
  });

  return validVariants;
}
