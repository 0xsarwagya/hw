import { DiscountScope, DiscountType } from "../dto/create-discount.dto";
import { DiscountResponseDto } from "../dto/discount-response.dto";
import { ResolvedDiscounts } from "./discount-engine.types";

/**
 * Resolve conflicts between discounts based on priority, stacking, and exclusivity
 * Returns separated product and cart discounts ready for application
 */
export function resolveConflicts(
  discounts: DiscountResponseDto[],
): ResolvedDiscounts {
  if (discounts.length === 0) {
    return { productDiscounts: [], cartDiscounts: [] };
  }

  // STEP 1: Sort by priority (ascending: lower = stronger)
  const sorted = [...discounts].sort((a, b) => a.priority - b.priority);

  // STEP 2: Build exclusion graph
  const exclusionMap = new Map<string, Set<string>>();
  for (const discount of sorted) {
    if (!exclusionMap.has(discount.id)) {
      exclusionMap.set(discount.id, new Set());
    }
    if (
      discount.excludedDiscountIds &&
      discount.excludedDiscountIds.length > 0
    ) {
      for (const excludedId of discount.excludedDiscountIds) {
        exclusionMap.get(discount.id)?.add(excludedId);
        // Bidirectional exclusion
        if (!exclusionMap.has(excludedId)) {
          exclusionMap.set(excludedId, new Set());
        }
        exclusionMap.get(excludedId)?.add(discount.id);
      }
    }
  }

  // STEP 3: Resolve mutually exclusive groups
  const resolved: DiscountResponseDto[] = [];
  const processed = new Set<string>();

  for (const discount of sorted) {
    if (processed.has(discount.id)) {
      continue;
    }

    // If mutually exclusive, check conflicts
    if (discount.mutuallyExclusive) {
      const exclusions = exclusionMap.get(discount.id) || new Set();
      // Mark conflicting discounts as processed (lower priority ones)
      for (const excludedId of exclusions) {
        if (!processed.has(excludedId)) {
          // Find the excluded discount
          const excludedDiscount = sorted.find((d) => d.id === excludedId);
          if (
            excludedDiscount &&
            excludedDiscount.priority > discount.priority
          ) {
            // Lower priority discount wins (lower number = higher priority)
            processed.add(excludedId);
          } else if (
            excludedDiscount &&
            excludedDiscount.priority < discount.priority
          ) {
            // Higher priority discount already processed, skip this one
            processed.add(discount.id);
            break;
          }
        }
      }
      if (processed.has(discount.id)) {
        continue;
      }
    }

    // Check if this discount conflicts with already resolved discounts
    const exclusions = exclusionMap.get(discount.id) || new Set();
    let hasConflict = false;
    for (const resolvedDiscount of resolved) {
      if (exclusions.has(resolvedDiscount.id)) {
        // Conflict found - skip this discount (already have higher priority one)
        hasConflict = true;
        break;
      }
    }

    if (!hasConflict) {
      resolved.push(discount);
      processed.add(discount.id);
    }
  }

  // STEP 4: Separate by scope
  const productDiscounts: DiscountResponseDto[] = [];
  const cartDiscounts: DiscountResponseDto[] = [];

  for (const discount of resolved) {
    if (
      discount.scope === DiscountScope.PRODUCT ||
      discount.type === DiscountType.TIERED ||
      discount.type === DiscountType.BUY_X_GET_Y
    ) {
      productDiscounts.push(discount);
    } else if (
      discount.scope === DiscountScope.ORDER ||
      discount.type === DiscountType.CART_LEVEL
    ) {
      cartDiscounts.push(discount);
    }
  }

  // STEP 5: Handle stacking rules
  // If canStack=false, only keep highest priority discount per scope
  const finalProductDiscounts = applyStackingRules(productDiscounts);
  const finalCartDiscounts = applyStackingRules(cartDiscounts);

  return {
    productDiscounts: finalProductDiscounts,
    cartDiscounts: finalCartDiscounts,
  };
}

/**
 * Apply stacking rules to a list of discounts
 * If canStack=false, only keep highest priority (lowest number)
 */
function applyStackingRules(
  discounts: DiscountResponseDto[],
): DiscountResponseDto[] {
  if (discounts.length === 0) {
    return [];
  }

  // Group by stacking compatibility
  const stackable: DiscountResponseDto[] = [];
  const nonStackable: DiscountResponseDto[] = [];

  for (const discount of discounts) {
    if (discount.canStack) {
      stackable.push(discount);
    } else {
      nonStackable.push(discount);
    }
  }

  // For non-stackable, only keep highest priority (lowest number)
  const finalNonStackable =
    nonStackable.length > 0
      ? [
          nonStackable.reduce((prev, curr) =>
            prev.priority < curr.priority ? prev : curr,
          ),
        ]
      : [];

  // Stackable discounts can all be applied
  return [...stackable, ...finalNonStackable];
}
