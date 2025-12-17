import { Injectable } from "@nestjs/common";
import { DiscountType } from "./dto/create-discount.dto";

/**
 * Authoritative discount validation service
 * Implements the formal discount model ruleset for Phase 12-1
 */
@Injectable()
export class DiscountValidationService {
  /**
   * Validate discount type compatibility
   */
  validateDiscountType(type: DiscountType): void {
    const validTypes = [
      DiscountType.FIXED_AMOUNT,
      DiscountType.PERCENTAGE,
      DiscountType.BUY_X_GET_Y,
      DiscountType.TIERED,
      DiscountType.CART_LEVEL,
    ];

    if (!validTypes.includes(type)) {
      throw new Error(`Invalid discount type: ${type}`);
    }
  }

  /**
   * Validate discount stacking rules
   * @param discount The discount to validate
   * @param appliedDiscounts Currently applied discounts
   */
  validateStackingRules(
    discount: {
      id: string;
      canStack: boolean;
      mutuallyExclusive: boolean;
      excludedDiscountIds: string[];
    },
    appliedDiscounts: Array<{
      id: string;
      canStack: boolean;
      mutuallyExclusive: boolean;
    }>,
  ): void {
    // Check mutually exclusive rule
    if (discount.mutuallyExclusive && appliedDiscounts.length > 0) {
      throw new Error("Mutually exclusive discount cannot be combined with other discounts");
    }

    // Check if any applied discount is mutually exclusive
    const hasMutuallyExclusive = appliedDiscounts.some(d => d.mutuallyExclusive);
    if (hasMutuallyExclusive) {
      throw new Error("Cannot add discount when a mutually exclusive discount is already applied");
    }

    // Check stacking compatibility
    if (!discount.canStack) {
      const incompatibleDiscounts = appliedDiscounts.filter(d => !d.canStack);
      if (incompatibleDiscounts.length > 0) {
        throw new Error("Non-stacking discount cannot be combined with other non-stacking discounts");
      }
    }

    // Check explicit exclusions
    const excludedIds = discount.excludedDiscountIds || [];
    const conflictingDiscounts = appliedDiscounts.filter(d =>
      excludedIds.includes(d.id)
    );

    if (conflictingDiscounts.length > 0) {
      throw new Error("Discount conflicts with currently applied discounts");
    }
  }

  /**
   * Validate discount constraints
   */
  validateConstraints(
    discount: {
      type: DiscountType;
      minOrderAmount?: number;
      minQuantity?: number;
      customerGroupIds?: string;
      startDate: Date;
      endDate?: Date;
      isActive: boolean;
      usageLimit?: number;
      usageCount: number;
      perUserLimit?: number;
    },
    context: {
      cartTotal: number;
      itemQuantity: number;
      customerGroupId?: string;
      userId?: string;
      userUsageCount?: number;
    },
  ): void {
    // Check if discount is active
    if (!discount.isActive) {
      throw new Error("Discount is not active");
    }

    // Check date validity
    const now = new Date();
    if (discount.startDate > now) {
      throw new Error("Discount has not started yet");
    }

    if (discount.endDate && discount.endDate < now) {
      throw new Error("Discount has expired");
    }

    // Check usage limits
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      throw new Error("Discount usage limit exceeded");
    }

    if (discount.perUserLimit && context.userUsageCount !== undefined) {
      if (context.userUsageCount >= discount.perUserLimit) {
        throw new Error("Discount per-user usage limit exceeded");
      }
    }

    // Check minimum order amount (for cart-level discounts)
    if (discount.minOrderAmount && context.cartTotal < discount.minOrderAmount) {
      throw new Error(`Minimum order amount of ₹${discount.minOrderAmount} required`);
    }

    // Check minimum quantity (for tiered/product-level discounts)
    if (discount.minQuantity && context.itemQuantity < discount.minQuantity) {
      throw new Error(`Minimum quantity of ${discount.minQuantity} required`);
    }

    // Check customer group restrictions
    if (discount.customerGroupIds && context.customerGroupId) {
      const allowedGroups = JSON.parse(discount.customerGroupIds);
      if (!allowedGroups.includes(context.customerGroupId)) {
        throw new Error("Discount not available for this customer group");
      }
    }
  }

  /**
   * Calculate discount priority (lower = stronger)
   */
  calculateDiscountPriority(
    discount: { priority: number; type: DiscountType },
    appliedDiscounts: Array<{ priority: number; type: DiscountType }>,
  ): number {
    // Priority is already stored, just return it
    // Lower number = higher priority (like Shopify)
    return discount.priority;
  }

  /**
   * Validate tiered discount rules
   */
  validateTieredRules(
    tieredRules: Array<{ minQuantity: number; value: number; valueType: string }>,
  ): void {
    if (!tieredRules || tieredRules.length === 0) {
      throw new Error("Tiered discount must have at least one rule");
    }

    // Validate rule progression (rules should be in increasing order)
    for (let i = 1; i < tieredRules.length; i++) {
      if (tieredRules[i].minQuantity <= tieredRules[i - 1].minQuantity) {
        throw new Error("Tiered rules must have increasing minimum quantities");
      }
    }

    // Validate values are reasonable
    for (const rule of tieredRules) {
      if (rule.value < 0) {
        throw new Error("Tiered rule values cannot be negative");
      }

      if (rule.valueType === "PERCENTAGE" && rule.value > 100) {
        throw new Error("Percentage values cannot exceed 100%");
      }
    }
  }

  /**
   * Get applicable tiered discount value
   */
  getTieredDiscountValue(
    tieredRules: Array<{ minQuantity: number; value: number; valueType: string }>,
    quantity: number,
  ): { value: number; valueType: string } {
    // Sort by minQuantity descending to find the highest applicable tier
    const sortedRules = [...tieredRules].sort((a, b) => b.minQuantity - a.minQuantity);

    for (const rule of sortedRules) {
      if (quantity >= rule.minQuantity) {
        return { value: rule.value, valueType: rule.valueType };
      }
    }

    throw new Error("No applicable tiered rule found for quantity");
  }

  /**
   * Validate cart-level discount application
   */
  validateCartLevelDiscount(
    discount: { type: DiscountType },
    cartItems: Array<{ quantity: number; price: number }>,
  ): void {
    if (discount.type !== DiscountType.CART_LEVEL) {
      return; // Not a cart-level discount
    }

    // Cart-level discounts apply to entire cart
    // Additional validation can be added here based on business rules
  }

  /**
   * Validate product-level discount application
   */
  validateProductLevelDiscount(
    discount: {
      type: DiscountType;
      productIds?: string[];
      categoryIds?: string[];
      collectionIds?: string[];
      tagIds?: string[];
    },
    product: {
      id: string;
      categoryId: string;
      collectionIds: string[];
      tagIds: string[];
    },
  ): boolean {
    if (discount.type === DiscountType.CART_LEVEL) {
      return true; // Cart-level applies to all products
    }

    // Check direct product match
    if (discount.productIds?.includes(product.id)) {
      return true;
    }

    // Check category match
    if (discount.categoryIds?.includes(product.categoryId)) {
      return true;
    }

    // Check collection match
    if (discount.collectionIds?.some(id => product.collectionIds.includes(id))) {
      return true;
    }

    // Check tag match
    if (discount.tagIds?.some(id => product.tagIds.includes(id))) {
      return true;
    }

    return false;
  }

  /**
   * Validate buy-get discount logic
   */
  validateBuyGetDiscount(
    discount: {
      type: DiscountType;
      buyProductIds?: string[];
      buyCategoryIds?: string[];
      buyCollectionIds?: string[];
      buyTagIds?: string[];
      getProductIds?: string[];
      getCategoryIds?: string[];
      getCollectionIds?: string[];
      getTagIds?: string[];
    },
    cartItems: Array<{
      productId: string;
      categoryId: string;
      collectionIds: string[];
      tagIds: string[];
      quantity: number;
    }>,
  ): void {
    if (discount.type !== DiscountType.BUY_X_GET_Y) {
      return;
    }

    // Count qualifying buy items
    let buyCount = 0;
    for (const item of cartItems) {
      if (this.isQualifyingItem(item, {
        productIds: discount.buyProductIds,
        categoryIds: discount.buyCategoryIds,
        collectionIds: discount.buyCollectionIds,
        tagIds: discount.buyTagIds,
      })) {
        buyCount += item.quantity;
      }
    }

    if (buyCount < 1) {
      throw new Error("Buy X Get Y discount requires at least one qualifying buy item");
    }

    // Validate that there are items to get discount on
    let getCount = 0;
    for (const item of cartItems) {
      if (this.isQualifyingItem(item, {
        productIds: discount.getProductIds,
        categoryIds: discount.getCategoryIds,
        collectionIds: discount.getCollectionIds,
        tagIds: discount.getTagIds,
      })) {
        getCount += item.quantity;
      }
    }

    if (getCount < 1) {
      throw new Error("Buy X Get Y discount requires at least one qualifying get item");
    }
  }

  /**
   * Check if item qualifies for discount rules
   */
  private isQualifyingItem(
    item: {
      productId: string;
      categoryId: string;
      collectionIds: string[];
      tagIds: string[];
    },
    rules: {
      productIds?: string[];
      categoryIds?: string[];
      collectionIds?: string[];
      tagIds?: string[];
    },
  ): boolean {
    // Check direct product match
    if (rules.productIds?.includes(item.productId)) {
      return true;
    }

    // Check category match
    if (rules.categoryIds?.includes(item.categoryId)) {
      return true;
    }

    // Check collection match
    if (rules.collectionIds?.some(id => item.collectionIds.includes(id))) {
      return true;
    }

    // Check tag match
    if (rules.tagIds?.some(id => item.tagIds.includes(id))) {
      return true;
    }

    return false;
  }
}
