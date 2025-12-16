import {
  DiscountScope,
  DiscountType,
  DiscountValueType,
} from "../../modules/discounts/dto/create-discount.dto";
import { DiscountResponseDto } from "../../modules/discounts/dto/discount-response.dto";

/**
 * Calculate discount amount based on discount type and value
 */
export function calculateDiscountAmount(
  discount: DiscountResponseDto,
  applicableAmount: number,
): number {
  if (discount.valueType === DiscountValueType.AMOUNT) {
    // Fixed amount discount
    let discountAmount = discount.value;

    // Apply max discount cap if set
    if (discount.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
    }

    // Don't exceed applicable amount
    return Math.min(discountAmount, applicableAmount);
  } else {
    // Percentage discount
    let discountAmount = (applicableAmount * discount.value) / 100;

    // Apply max discount cap if set
    if (discount.maxDiscountAmount) {
      discountAmount = Math.min(discountAmount, discount.maxDiscountAmount);
    }

    return discountAmount;
  }
}

/**
 * Check if a product is eligible for a STANDARD discount
 */
export function isProductEligibleForStandardDiscount(
  discount: DiscountResponseDto,
  productId: string,
  categoryId: string | null,
  collectionIds: string[],
  tagIds: string[],
): boolean {
  // If discount has no specific products/categories/collections/tags, it applies to all
  const hasSpecificTargets =
    discount.productIds.length > 0 ||
    discount.categoryIds.length > 0 ||
    discount.collectionIds.length > 0 ||
    discount.tagIds.length > 0;

  if (!hasSpecificTargets) {
    return true; // Applies to all products
  }

  // Check product IDs
  if (
    discount.productIds.length > 0 &&
    discount.productIds.includes(productId)
  ) {
    return true;
  }

  // Check category ID
  if (
    discount.categoryIds.length > 0 &&
    categoryId &&
    discount.categoryIds.includes(categoryId)
  ) {
    return true;
  }

  // Check collection IDs
  if (
    discount.collectionIds.length > 0 &&
    collectionIds.some((id) => discount.collectionIds.includes(id))
  ) {
    return true;
  }

  // Check tag IDs
  if (
    discount.tagIds.length > 0 &&
    tagIds.some((id) => discount.tagIds.includes(id))
  ) {
    return true;
  }

  return false;
}

/**
 * Check if products qualify for BUY_GET discount
 */
export function checkBuyGetDiscountEligibility(
  discount: DiscountResponseDto,
  cartItems: Array<{
    productId: string;
    categoryId: string | null;
    collectionIds: string[];
    tagIds: string[];
    quantity: number;
  }>,
): {
  isEligible: boolean;
  buyItems: Array<{ productId: string; quantity: number }>;
  getItems: Array<{ productId: string; quantity: number }>;
} {
  // Check if cart has items that match "buy" criteria
  const buyItems: Array<{ productId: string; quantity: number }> = [];

  for (const item of cartItems) {
    // Check if this item matches buy criteria
    const matchesBuy =
      (discount.buyProductIds.length > 0 &&
        discount.buyProductIds.includes(item.productId)) ||
      (discount.buyCategoryIds.length > 0 &&
        item.categoryId &&
        discount.buyCategoryIds.includes(item.categoryId)) ||
      (discount.buyCollectionIds.length > 0 &&
        item.collectionIds.some((id) =>
          discount.buyCollectionIds.includes(id),
        )) ||
      (discount.buyTagIds.length > 0 &&
        item.tagIds.some((id) => discount.buyTagIds.includes(id)));

    if (matchesBuy) {
      buyItems.push({
        productId: item.productId,
        quantity: item.quantity,
      });
    }
  }

  // If no buy items, discount doesn't apply
  if (buyItems.length === 0) {
    return {
      isEligible: false,
      buyItems: [],
      getItems: [],
    };
  }

  // Determine which items qualify for "get" discount
  const getItems: Array<{ productId: string; quantity: number }> = [];

  if (discount.scope === DiscountScope.ORDER) {
    // Discount applies to entire order
    // Get all items that match "get" criteria (or all items if no criteria)
    const hasGetCriteria =
      discount.getProductIds.length > 0 ||
      discount.getCategoryIds.length > 0 ||
      discount.getCollectionIds.length > 0 ||
      discount.getTagIds.length > 0;

    for (const item of cartItems) {
      if (!hasGetCriteria) {
        // No criteria means all items qualify
        getItems.push({
          productId: item.productId,
          quantity: item.quantity,
        });
      } else {
        // Check if item matches get criteria
        const matchesGet =
          (discount.getProductIds.length > 0 &&
            discount.getProductIds.includes(item.productId)) ||
          (discount.getCategoryIds.length > 0 &&
            item.categoryId &&
            discount.getCategoryIds.includes(item.categoryId)) ||
          (discount.getCollectionIds.length > 0 &&
            item.collectionIds.some((id) =>
              discount.getCollectionIds.includes(id),
            )) ||
          (discount.getTagIds.length > 0 &&
            item.tagIds.some((id) => discount.getTagIds.includes(id)));

        if (matchesGet) {
          getItems.push({
            productId: item.productId,
            quantity: item.quantity,
          });
        }
      }
    }
  } else {
    // Discount applies to specific products
    // Only items matching "get" criteria qualify
    for (const item of cartItems) {
      const matchesGet =
        (discount.getProductIds.length > 0 &&
          discount.getProductIds.includes(item.productId)) ||
        (discount.getCategoryIds.length > 0 &&
          item.categoryId &&
          discount.getCategoryIds.includes(item.categoryId)) ||
        (discount.getCollectionIds.length > 0 &&
          item.collectionIds.some((id) =>
            discount.getCollectionIds.includes(id),
          )) ||
        (discount.getTagIds.length > 0 &&
          item.tagIds.some((id) => discount.getTagIds.includes(id)));

      if (matchesGet) {
        getItems.push({
          productId: item.productId,
          quantity: item.quantity,
        });
      }
    }
  }

  return {
    isEligible: getItems.length > 0,
    buyItems,
    getItems,
  };
}

/**
 * Calculate discount for STANDARD type discount
 */
export function calculateStandardDiscount(
  discount: DiscountResponseDto,
  cartItems: Array<{
    productId: string;
    categoryId: string | null;
    collectionIds: string[];
    tagIds: string[];
    price: number;
    quantity: number;
  }>,
): {
  discountAmount: number;
  itemDiscounts: Array<{ productId: string; discountAmount: number }>;
} {
  let totalDiscountAmount = 0;
  const itemDiscounts: Array<{ productId: string; discountAmount: number }> =
    [];

  if (discount.scope === DiscountScope.ORDER) {
    // Calculate total applicable amount
    let applicableAmount = 0;

    for (const item of cartItems) {
      const isEligible = isProductEligibleForStandardDiscount(
        discount,
        item.productId,
        item.categoryId,
        item.collectionIds,
        item.tagIds,
      );

      if (isEligible) {
        applicableAmount += item.price * item.quantity;
      }
    }

    // Calculate discount on total
    totalDiscountAmount = calculateDiscountAmount(discount, applicableAmount);

    // Distribute discount proportionally across eligible items
    if (applicableAmount > 0) {
      for (const item of cartItems) {
        const isEligible = isProductEligibleForStandardDiscount(
          discount,
          item.productId,
          item.categoryId,
          item.collectionIds,
          item.tagIds,
        );

        if (isEligible) {
          const itemAmount = item.price * item.quantity;
          const itemDiscount =
            (totalDiscountAmount * itemAmount) / applicableAmount;
          itemDiscounts.push({
            productId: item.productId,
            discountAmount: itemDiscount,
          });
        }
      }
    }
  } else {
    // PRODUCT scope - calculate discount per eligible product
    for (const item of cartItems) {
      const isEligible = isProductEligibleForStandardDiscount(
        discount,
        item.productId,
        item.categoryId,
        item.collectionIds,
        item.tagIds,
      );

      if (isEligible) {
        const itemAmount = item.price * item.quantity;
        const itemDiscount = calculateDiscountAmount(discount, itemAmount);
        totalDiscountAmount += itemDiscount;
        itemDiscounts.push({
          productId: item.productId,
          discountAmount: itemDiscount,
        });
      }
    }
  }

  return {
    discountAmount: totalDiscountAmount,
    itemDiscounts,
  };
}

/**
 * Calculate discount for BUY_GET type discount
 */
export function calculateBuyGetDiscount(
  discount: DiscountResponseDto,
  cartItems: Array<{
    productId: string;
    categoryId: string | null;
    collectionIds: string[];
    tagIds: string[];
    price: number;
    quantity: number;
  }>,
): {
  discountAmount: number;
  itemDiscounts: Array<{ productId: string; discountAmount: number }>;
} {
  const eligibility = checkBuyGetDiscountEligibility(
    discount,
    cartItems.map((item) => ({
      productId: item.productId,
      categoryId: item.categoryId,
      collectionIds: item.collectionIds,
      tagIds: item.tagIds,
      quantity: item.quantity,
    })),
  );

  if (!eligibility.isEligible) {
    return {
      discountAmount: 0,
      itemDiscounts: [],
    };
  }

  let totalDiscountAmount = 0;
  const itemDiscounts: Array<{ productId: string; discountAmount: number }> =
    [];

  // Calculate applicable amount from "get" items
  let applicableAmount = 0;
  const getItemMap = new Map<string, number>();

  for (const item of cartItems) {
    const isGetItem = eligibility.getItems.some(
      (getItem) => getItem.productId === item.productId,
    );

    if (isGetItem) {
      const itemAmount = item.price * item.quantity;
      applicableAmount += itemAmount;
      getItemMap.set(item.productId, itemAmount);
    }
  }

  // Calculate discount
  if (discount.scope === DiscountScope.ORDER) {
    // Discount applies to entire order (get items)
    totalDiscountAmount = calculateDiscountAmount(discount, applicableAmount);

    // Distribute discount proportionally
    if (applicableAmount > 0) {
      for (const [productId, itemAmount] of getItemMap.entries()) {
        const itemDiscount =
          (totalDiscountAmount * itemAmount) / applicableAmount;
        itemDiscounts.push({
          productId,
          discountAmount: itemDiscount,
        });
      }
    }
  } else {
    // Discount applies per product
    for (const [productId, itemAmount] of getItemMap.entries()) {
      const itemDiscount = calculateDiscountAmount(discount, itemAmount);
      totalDiscountAmount += itemDiscount;
      itemDiscounts.push({
        productId,
        discountAmount: itemDiscount,
      });
    }
  }

  return {
    discountAmount: totalDiscountAmount,
    itemDiscounts,
  };
}

/**
 * Calculate discount for cart/order
 */
export function calculateDiscount(
  discount: DiscountResponseDto,
  cartItems: Array<{
    productId: string;
    categoryId: string | null;
    collectionIds: string[];
    tagIds: string[];
    price: number;
    quantity: number;
  }>,
): {
  discountAmount: number;
  itemDiscounts: Array<{ productId: string; discountAmount: number }>;
} {
  if (discount.type === DiscountType.STANDARD) {
    return calculateStandardDiscount(discount, cartItems);
  } else {
    return calculateBuyGetDiscount(discount, cartItems);
  }
}
