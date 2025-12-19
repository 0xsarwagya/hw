import { DiscountScope, DiscountType } from "../dto/create-discount.dto";
import { DiscountResponseDto } from "../dto/discount-response.dto";
import { ResolvedDiscounts } from "./discount-engine.types";

/**
 * Resolve conflicts between discounts based on priority, stacking, and exclusivity
 *
 * This algorithm ensures that:
 * - Higher priority discounts (lower priority number) take precedence
 * - Mutually exclusive discounts are properly handled
 * - Stacking rules are respected (canStack flag)
 * - Exclusion lists are bidirectional (if A excludes B, B excludes A)
 *
 * Returns separated product and cart discounts ready for application
 */
export function resolveConflicts(
  discounts: DiscountResponseDto[],
): ResolvedDiscounts {
  if (discounts.length === 0) {
    return { productDiscounts: [], cartDiscounts: [] };
  }

  // Sort by priority: lower number = higher priority
  // This ensures we process discounts in order of importance
  const sorted = [...discounts].sort((a, b) => a.priority - b.priority);

  // Build bidirectional exclusion graph
  // This allows us to quickly check if two discounts conflict
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
        // Make exclusion bidirectional: if A excludes B, then B also excludes A
        // This simplifies conflict detection later
        if (!exclusionMap.has(excludedId)) {
          exclusionMap.set(excludedId, new Set());
        }
        exclusionMap.get(excludedId)?.add(discount.id);
      }
    }
  }

  // Resolve conflicts: process discounts in priority order
  // Higher priority discounts (lower number) are applied first
  const resolved: DiscountResponseDto[] = [];
  const processed = new Set<string>();

  for (const discount of sorted) {
    // Skip if already processed (excluded by higher priority discount)
    if (processed.has(discount.id)) {
      continue;
    }

    // Handle mutually exclusive discounts
    // If this discount is mutually exclusive, we need to check all its exclusions
    if (discount.mutuallyExclusive) {
      const exclusions = exclusionMap.get(discount.id) || new Set();
      for (const excludedId of exclusions) {
        if (!processed.has(excludedId)) {
          const excludedDiscount = sorted.find(
            (discount) => discount.id === excludedId,
          );
          // If excluded discount has lower priority (higher number), mark it as processed
          // If excluded discount has higher priority (lower number), skip current discount
          if (
            excludedDiscount &&
            excludedDiscount.priority > discount.priority
          ) {
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
    // This prevents applying discounts that exclude each other
    const exclusions = exclusionMap.get(discount.id) || new Set();
    let hasConflict = false;
    for (const resolvedDiscount of resolved) {
      if (exclusions.has(resolvedDiscount.id)) {
        // Conflict found: a higher priority discount already excludes this one
        hasConflict = true;
        break;
      }
    }

    if (!hasConflict) {
      resolved.push(discount);
      processed.add(discount.id);
    }
  }

  // Separate discounts by scope: product-level vs cart-level
  // Product discounts are applied first, then cart discounts
  const productDiscounts: DiscountResponseDto[] = [];
  const cartDiscounts: DiscountResponseDto[] = [];

  for (const discount of resolved) {
    // Tiered and BOGO discounts are always product-level (quantity-based)
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

  // Apply stacking rules: non-stackable discounts can't be combined
  // If canStack=false, only the highest priority discount is kept
  const finalProductDiscounts = applyStackingRules(productDiscounts);
  const finalCartDiscounts = applyStackingRules(cartDiscounts);

  return {
    productDiscounts: finalProductDiscounts,
    cartDiscounts: finalCartDiscounts,
  };
}

/**
 * Apply stacking rules to a list of discounts
 *
 * Business rule: Non-stackable discounts cannot be combined
 * Only the highest priority (lowest priority number) non-stackable discount is kept
 * Stackable discounts can all be applied together
 */
function applyStackingRules(
  discounts: DiscountResponseDto[],
): DiscountResponseDto[] {
  if (discounts.length === 0) {
    return [];
  }

  // Separate stackable from non-stackable discounts
  const stackable: DiscountResponseDto[] = [];
  const nonStackable: DiscountResponseDto[] = [];

  for (const discount of discounts) {
    if (discount.canStack) {
      stackable.push(discount);
    } else {
      nonStackable.push(discount);
    }
  }

  // For non-stackable discounts, only keep the highest priority one
  // This enforces the business rule that non-stackable discounts can't be combined
  const finalNonStackable =
    nonStackable.length > 0
      ? [
          nonStackable.reduce((prev, curr) =>
            prev.priority < curr.priority ? prev : curr,
          ),
        ]
      : [];

  // All stackable discounts can be applied together
  return [...stackable, ...finalNonStackable];
}
