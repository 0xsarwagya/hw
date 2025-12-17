import {
  calculateDiscountAmount,
  isProductEligibleForStandardDiscount,
} from "../../../common/utils/discount.utils";
import { DiscountScope, DiscountType } from "../dto/create-discount.dto";
import { DiscountResponseDto } from "../dto/discount-response.dto";
import { DiscountedLineItem } from "./discount-engine.types";
import { ensureNonNegative, roundToTwoDecimals } from "./rounding.utils";

/**
 * Apply product-level discounts to line items
 * PRODUCT scope discounts are applied first, before cart-level discounts
 */
export function applyProductDiscounts(
  items: Array<{
    id: string;
    productVariantId: string;
    productId: string;
    categoryId: string | null;
    collectionIds: string[];
    tagIds: string[];
    price: number;
    quantity: number;
  }>,
  discounts: DiscountResponseDto[],
): DiscountedLineItem[] {
  // Filter to only product-level discounts
  const productDiscounts = discounts.filter(
    (d) =>
      d.scope === DiscountScope.PRODUCT &&
      (d.type === DiscountType.FIXED_AMOUNT ||
        d.type === DiscountType.PERCENTAGE ||
        d.type === DiscountType.TIERED),
  );

  if (productDiscounts.length === 0) {
    // No product discounts, return items as-is
    return items.map((item) => ({
      id: item.id,
      productVariantId: item.productVariantId,
      productId: item.productId,
      originalPrice: item.price,
      quantity: item.quantity,
      lineTotal: item.price * item.quantity,
      discounts: [],
    }));
  }

  // Sort discounts by priority (ascending: lower = stronger)
  const sortedDiscounts = [...productDiscounts].sort(
    (a, b) => a.priority - b.priority,
  );

  // Apply discounts to each line item
  return items.map((item) => {
    const originalLineTotal = item.price * item.quantity;
    let currentLineTotal = originalLineTotal;
    const appliedDiscounts: Array<{
      discountId: string;
      discountCode: string;
      discountAmount: number;
      discountType: DiscountType;
    }> = [];

    // Find applicable discounts for this item
    const applicableDiscounts = sortedDiscounts.filter((discount) =>
      isProductEligibleForStandardDiscount(
        discount,
        item.productId,
        item.categoryId,
        item.collectionIds,
        item.tagIds,
      ),
    );

    // Group by stacking compatibility
    const stackableDiscounts: DiscountResponseDto[] = [];
    const nonStackableDiscounts: DiscountResponseDto[] = [];

    for (const discount of applicableDiscounts) {
      if (discount.canStack) {
        stackableDiscounts.push(discount);
      } else {
        nonStackableDiscounts.push(discount);
      }
    }

    // Apply non-stackable discount (highest priority only)
    if (nonStackableDiscounts.length > 0) {
      const highestPriority = nonStackableDiscounts.reduce((prev, curr) =>
        prev.priority < curr.priority ? prev : curr,
      );
      const discountAmount = calculateDiscountAmount(
        highestPriority,
        currentLineTotal,
      );
      const roundedDiscount = roundToTwoDecimals(discountAmount);
      currentLineTotal = ensureNonNegative(currentLineTotal - roundedDiscount);
      appliedDiscounts.push({
        discountId: highestPriority.id,
        discountCode: highestPriority.code,
        discountAmount: roundedDiscount,
        discountType: highestPriority.type,
      });
    }

    // Apply stackable discounts (all eligible)
    for (const discount of stackableDiscounts) {
      const discountAmount = calculateDiscountAmount(
        discount,
        currentLineTotal, // Apply to already discounted amount
      );
      const roundedDiscount = roundToTwoDecimals(discountAmount);
      currentLineTotal = ensureNonNegative(currentLineTotal - roundedDiscount);
      appliedDiscounts.push({
        discountId: discount.id,
        discountCode: discount.code,
        discountAmount: roundedDiscount,
        discountType: discount.type,
      });
    }

    // Round final line total
    const finalLineTotal = roundToTwoDecimals(currentLineTotal);

    return {
      id: item.id,
      productVariantId: item.productVariantId,
      productId: item.productId,
      originalPrice: item.price,
      quantity: item.quantity,
      lineTotal: finalLineTotal,
      discounts: appliedDiscounts,
    };
  });
}
