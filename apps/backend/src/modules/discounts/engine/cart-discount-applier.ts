import { calculateDiscountAmount } from "../../../common/utils/discount.utils";
import { DiscountScope, DiscountType } from "../dto/create-discount.dto";
import { DiscountResponseDto } from "../dto/discount-response.dto";
import { AppliedCartDiscount } from "./discount-engine.types";
import { ensureNonNegative, roundToTwoDecimals } from "./rounding.utils";

/**
 * Apply cart-level discounts to subtotal
 * Cart discounts are applied AFTER product-level and tiered/BOGO discounts
 * @param subtotal - Subtotal after product/tiered discounts (base price, excluding GST)
 * @param discounts - Cart-level discounts to apply
 * @param totalGstAmount - Total GST amount from original items (for TOTAL calculationBasis)
 */
export function applyCartDiscounts(
  subtotal: number,
  discounts: DiscountResponseDto[],
  totalGstAmount: number = 0,
): {
  cartDiscounts: AppliedCartDiscount[];
  subtotalAfterCartDiscounts: number;
} {
  // Filter to only cart-level discounts
  const cartDiscounts = discounts.filter(
    (d) =>
      (d.scope === DiscountScope.ORDER || d.type === DiscountType.CART_LEVEL) &&
      d.type !== DiscountType.BUY_X_GET_Y &&
      d.type !== DiscountType.TIERED,
  );

  if (cartDiscounts.length === 0) {
    return {
      cartDiscounts: [],
      subtotalAfterCartDiscounts: subtotal,
    };
  }

  // Sort by priority (ascending: lower = stronger)
  const sortedDiscounts = [...cartDiscounts].sort(
    (a, b) => a.priority - b.priority,
  );

  // Group by stacking compatibility
  const stackableDiscounts: DiscountResponseDto[] = [];
  const nonStackableDiscounts: DiscountResponseDto[] = [];

  for (const discount of sortedDiscounts) {
    if (discount.canStack) {
      stackableDiscounts.push(discount);
    } else {
      nonStackableDiscounts.push(discount);
    }
  }

  let currentSubtotal = subtotal;
  const appliedDiscounts: AppliedCartDiscount[] = [];

  // Apply non-stackable discount (highest priority only)
  if (nonStackableDiscounts.length > 0) {
    const highestPriority = nonStackableDiscounts.reduce((prev, curr) =>
      prev.priority < curr.priority ? prev : curr,
    );
    // For TOTAL calculationBasis, calculate discount on (subtotal + GST)
    const applicableAmount =
      highestPriority.calculationBasis === "TOTAL"
        ? currentSubtotal + totalGstAmount
        : currentSubtotal;
    const discountAmount = calculateDiscountAmount(
      highestPriority,
      applicableAmount,
    );
    const roundedDiscount = roundToTwoDecimals(discountAmount);
    currentSubtotal = ensureNonNegative(currentSubtotal - roundedDiscount);
    appliedDiscounts.push({
      discountId: highestPriority.id,
      discountCode: highestPriority.code,
      discountAmount: roundedDiscount,
      discountType: highestPriority.type,
    });
  }

  // Apply stackable discounts (all eligible)
  for (const discount of stackableDiscounts) {
    // For TOTAL calculationBasis, calculate discount on (subtotal + GST)
    const applicableAmount =
      discount.calculationBasis === "TOTAL"
        ? currentSubtotal + totalGstAmount
        : currentSubtotal;
    const discountAmount = calculateDiscountAmount(
      discount,
      applicableAmount, // Apply to already discounted subtotal
    );
    const roundedDiscount = roundToTwoDecimals(discountAmount);
    currentSubtotal = ensureNonNegative(currentSubtotal - roundedDiscount);
    appliedDiscounts.push({
      discountId: discount.id,
      discountCode: discount.code,
      discountAmount: roundedDiscount,
      discountType: discount.type,
    });
  }

  return {
    cartDiscounts: appliedDiscounts,
    subtotalAfterCartDiscounts: roundToTwoDecimals(currentSubtotal),
  };
}
