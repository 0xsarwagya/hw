import {
  calculateDiscountAmount,
  checkBuyGetDiscountEligibility,
} from "../../../common/utils/discount.utils";
import { DiscountType, DiscountValueType } from "../dto/create-discount.dto";
import { DiscountResponseDto } from "../dto/discount-response.dto";
import { DiscountedLineItem } from "./discount-engine.types";
import { ensureNonNegative, roundToTwoDecimals } from "./rounding.utils";

/**
 * Apply tiered pricing and BOGO discounts
 * These are applied after product-level discounts but before cart-level discounts
 */
export function applyTieredAndBogo(
  lineItems: DiscountedLineItem[],
  resolvedDiscounts: {
    productDiscounts: DiscountResponseDto[];
    cartDiscounts: DiscountResponseDto[];
  },
): DiscountedLineItem[] {
  // Separate tiered and BOGO discounts
  const tieredDiscounts = resolvedDiscounts.productDiscounts.filter(
    (d) => d.type === DiscountType.TIERED,
  );
  const bogoDiscounts = resolvedDiscounts.productDiscounts.filter(
    (d) => d.type === DiscountType.BUY_X_GET_Y,
  );

  let result = [...lineItems];

  // STEP 1: Apply tiered pricing
  if (tieredDiscounts.length > 0) {
    result = applyTieredPricing(result, tieredDiscounts);
  }

  // STEP 2: Apply BOGO discounts
  if (bogoDiscounts.length > 0) {
    result = applyBogoDiscounts(result, bogoDiscounts);
  }

  return result;
}

/**
 * Apply tiered pricing discounts
 * Tiered discounts are quantity-based: buy 3+ get 20% off
 */
function applyTieredPricing(
  lineItems: DiscountedLineItem[],
  tieredDiscounts: DiscountResponseDto[],
): DiscountedLineItem[] {
  return lineItems.map((item) => {
    // Find applicable tiered discount for this item
    const applicableDiscount = tieredDiscounts.find((discount) => {
      if (!discount.tieredRules || discount.tieredRules.length === 0) {
        return false;
      }

      // Check if item matches discount eligibility (product/category/collection/tag)
      // For tiered, we need to check if the item is eligible
      // This is simplified - in real implementation, you'd check product eligibility
      return true; // Simplified for now
    });

    if (!applicableDiscount || !applicableDiscount.tieredRules) {
      return item;
    }

    // Find matching tier based on quantity
    const matchingTier = applicableDiscount.tieredRules
      .sort((a, b) => b.minQuantity - a.minQuantity) // Sort descending
      .find((tier) => item.quantity >= tier.minQuantity);

    if (!matchingTier) {
      return item;
    }

    // Calculate discount based on tier
    const currentLineTotal = item.lineTotal;
    let discountAmount = 0;

    if (matchingTier.valueType === DiscountValueType.PERCENTAGE) {
      discountAmount = (currentLineTotal * matchingTier.value) / 100;
    } else {
      discountAmount = matchingTier.value;
    }

    // Apply max discount cap if set
    if (applicableDiscount.maxDiscountAmount) {
      discountAmount = Math.min(
        discountAmount,
        applicableDiscount.maxDiscountAmount,
      );
    }

    const roundedDiscount = roundToTwoDecimals(discountAmount);
    const newLineTotal = ensureNonNegative(currentLineTotal - roundedDiscount);

    return {
      ...item,
      lineTotal: roundToTwoDecimals(newLineTotal),
      discounts: [
        ...item.discounts,
        {
          discountId: applicableDiscount.id,
          discountCode: applicableDiscount.code,
          discountAmount: roundedDiscount,
          discountType: DiscountType.TIERED,
        },
      ],
    };
  });
}

/**
 * Apply BOGO (Buy X Get Y) discounts
 */
function applyBogoDiscounts(
  lineItems: DiscountedLineItem[],
  bogoDiscounts: DiscountResponseDto[],
): DiscountedLineItem[] {
  // Convert to format expected by checkBuyGetDiscountEligibility
  const cartItemsForEligibility = lineItems.map((item) => ({
    productId: item.productId,
    categoryId: null, // Would need to pass this through
    collectionIds: [],
    tagIds: [],
    quantity: item.quantity,
  }));

  const result = [...lineItems];

  for (const bogoDiscount of bogoDiscounts) {
    const eligibility = checkBuyGetDiscountEligibility(
      bogoDiscount,
      cartItemsForEligibility,
    );

    if (!eligibility.isEligible || eligibility.getItems.length === 0) {
      continue;
    }

    // Calculate total buy quantity
    const totalBuyQuantity = eligibility.buyItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    // Calculate eligible get quantity (simplified: 1:1 ratio)
    // In real implementation, you'd use buyQuantity/getQuantity ratio from discount
    const eligibleGetQuantity = Math.min(
      totalBuyQuantity,
      eligibility.getItems.reduce((sum, item) => sum + item.quantity, 0),
    );

    // Apply discount to get items
    for (const getItem of eligibility.getItems) {
      const lineItemIndex = result.findIndex(
        (item) => item.productId === getItem.productId,
      );

      if (lineItemIndex === -1) {
        continue;
      }

      const lineItem = result[lineItemIndex];
      const applicableQuantity = Math.min(
        eligibleGetQuantity,
        lineItem.quantity,
      );

      if (applicableQuantity === 0) {
        continue;
      }

      // Calculate discount amount for applicable quantity
      const applicableAmount =
        ((lineItem.originalPrice * applicableQuantity) / lineItem.quantity) *
        lineItem.lineTotal;
      const discountAmount = calculateDiscountAmount(
        bogoDiscount,
        applicableAmount,
      );

      const roundedDiscount = roundToTwoDecimals(discountAmount);
      const newLineTotal = ensureNonNegative(
        lineItem.lineTotal - roundedDiscount,
      );

      result[lineItemIndex] = {
        ...lineItem,
        lineTotal: roundToTwoDecimals(newLineTotal),
        discounts: [
          ...lineItem.discounts,
          {
            discountId: bogoDiscount.id,
            discountCode: bogoDiscount.code,
            discountAmount: roundedDiscount,
            discountType: DiscountType.BUY_X_GET_Y,
          },
        ],
      };
    }
  }

  return result;
}
