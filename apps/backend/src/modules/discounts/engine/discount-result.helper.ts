import { DiscountStep, DiscountedLineItem } from "./discount-engine.types";
import { roundToTwoDecimals } from "./rounding.utils";

/**
 * Helper functions for building discount engine results
 * Extracted to improve readability and maintainability
 */

/**
 * Create line items without discounts (for early return case)
 */
export function createUndiscountedLineItems(
  cartItems: Array<{
    id: string;
    productVariantId: string;
    productId: string;
    price: number;
    quantity: number;
  }>,
): DiscountedLineItem[] {
  return cartItems.map((item) => ({
    id: item.id,
    productVariantId: item.productVariantId,
    productId: item.productId,
    originalPrice: item.price,
    quantity: item.quantity,
    lineTotal: roundToTwoDecimals(item.price * item.quantity),
    discounts: [],
  }));
}

/**
 * Create initial discount step for tracking
 */
export function createInitialDiscountStep(
  initialSubtotal: number,
): DiscountStep {
  return {
    step: "1",
    description: "Initial cart subtotal",
    discountsApplied: [],
    subtotalAfter: initialSubtotal,
  };
}

/**
 * Create discount step for filtered discounts
 */
export function createFilteredDiscountStep(
  totalDiscounts: number,
  eligibleDiscounts: number,
  discountCodes: string[],
  subtotalAfter: number,
): DiscountStep {
  return {
    step: "2",
    description: `Filtered ${totalDiscounts} discounts to ${eligibleDiscounts} eligible`,
    discountsApplied: discountCodes,
    subtotalAfter,
  };
}

/**
 * Create discount step for conflict resolution
 */
export function createConflictResolutionStep(
  productDiscounts: number,
  cartDiscounts: number,
  discountCodes: string[],
  subtotalAfter: number,
): DiscountStep {
  return {
    step: "3",
    description: `Resolved conflicts: ${productDiscounts} product, ${cartDiscounts} cart discounts`,
    discountsApplied: discountCodes,
    subtotalAfter,
  };
}

