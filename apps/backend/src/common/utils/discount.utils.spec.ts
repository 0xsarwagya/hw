import {
  calculateBuyGetDiscount,
  calculateDiscount,
  calculateDiscountAmount,
  calculateStandardDiscount,
  checkBuyGetDiscountEligibility,
  isProductEligibleForStandardDiscount,
} from "./discount.utils";
import { DiscountResponseDto } from "../../modules/discounts/dto/discount-response.dto";
import {
  DiscountScope,
  DiscountType,
  DiscountValueType,
} from "../../modules/discounts/dto/create-discount.dto";

describe("Discount Utils", () => {
  const mockStandardDiscount: DiscountResponseDto = {
    id: "discount-1",
    code: "SAVE20",
    name: "20% Off",
    description: "Get 20% off",
    type: DiscountType.PERCENTAGE,
    applicationType: "MANUAL",
    valueType: DiscountValueType.PERCENTAGE,
    value: 20,
    minOrderAmount: null,
    maxDiscountAmount: null,
    scope: DiscountScope.PRODUCT,
    priority: 1,
    canStack: true,
    mutuallyExclusive: false,
    minQuantity: null,
    customerGroupIds: null,
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    isActive: true,
    usageLimit: null,
    usageCount: 0,
    perUserLimit: null,
    productIds: ["product-1", "product-2"],
    categoryIds: [],
    collectionIds: [],
    tagIds: [],
    buyProductIds: [],
    buyCategoryIds: [],
    buyCollectionIds: [],
    buyTagIds: [],
    getProductIds: [],
    getCategoryIds: [],
    getCollectionIds: [],
    getTagIds: [],
    tieredRules: [],
    excludedDiscountIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAmountDiscount: DiscountResponseDto = {
    ...mockStandardDiscount,
    code: "SAVE100",
    valueType: DiscountValueType.AMOUNT,
    value: 100,
  };

  describe("calculateDiscountAmount", () => {
    it("should calculate percentage discount correctly", () => {
      const discount = { ...mockStandardDiscount, value: 20 };
      const amount = calculateDiscountAmount(discount, 1000);
      expect(amount).toBe(200);
    });

    it("should calculate amount discount correctly", () => {
      const amount = calculateDiscountAmount(mockAmountDiscount, 1000);
      expect(amount).toBe(100);
    });

    it("should apply max discount cap for percentage", () => {
      const discount = {
        ...mockStandardDiscount,
        value: 50,
        maxDiscountAmount: 200,
      };
      const amount = calculateDiscountAmount(discount, 1000);
      expect(amount).toBe(200); // 50% of 1000 = 500, but capped at 200
    });

    it("should not exceed applicable amount for amount discount", () => {
      const amount = calculateDiscountAmount(mockAmountDiscount, 50);
      expect(amount).toBe(50); // Can't discount more than the amount
    });
  });

  describe("isProductEligibleForStandardDiscount", () => {
    it("should return true if discount has no specific targets", () => {
      const discount = { ...mockStandardDiscount, productIds: [] };
      const eligible = isProductEligibleForStandardDiscount(
        discount,
        "product-1",
        null,
        [],
        [],
      );
      expect(eligible).toBe(true);
    });

    it("should return true if product ID matches", () => {
      const eligible = isProductEligibleForStandardDiscount(
        mockStandardDiscount,
        "product-1",
        null,
        [],
        [],
      );
      expect(eligible).toBe(true);
    });

    it("should return true if category ID matches", () => {
      const discount = {
        ...mockStandardDiscount,
        productIds: [],
        categoryIds: ["category-1"],
      };
      const eligible = isProductEligibleForStandardDiscount(
        discount,
        "product-1",
        "category-1",
        [],
        [],
      );
      expect(eligible).toBe(true);
    });

    it("should return false if product doesn't match any criteria", () => {
      const eligible = isProductEligibleForStandardDiscount(
        mockStandardDiscount,
        "product-3",
        null,
        [],
        [],
      );
      expect(eligible).toBe(false);
    });
  });

  describe("checkBuyGetDiscountEligibility", () => {
    const buyGetDiscount: DiscountResponseDto = {
      ...mockStandardDiscount,
      type: DiscountType.BUY_GET,
      buyProductIds: ["product-1"],
      getProductIds: ["product-2"],
      scope: DiscountScope.PRODUCT,
    };

    it("should return eligible if buy and get items match", () => {
      const cartItems = [
        {
          productId: "product-1",
          categoryId: null,
          collectionIds: [],
          tagIds: [],
          quantity: 1,
        },
        {
          productId: "product-2",
          categoryId: null,
          collectionIds: [],
          tagIds: [],
          quantity: 1,
        },
      ];

      const result = checkBuyGetDiscountEligibility(buyGetDiscount, cartItems);
      expect(result.isEligible).toBe(true);
      expect(result.buyItems.length).toBe(1);
      expect(result.getItems.length).toBe(1);
    });

    it("should return not eligible if buy items missing", () => {
      const cartItems = [
        {
          productId: "product-2",
          categoryId: null,
          collectionIds: [],
          tagIds: [],
          quantity: 1,
        },
      ];

      const result = checkBuyGetDiscountEligibility(buyGetDiscount, cartItems);
      expect(result.isEligible).toBe(false);
    });

    it("should return eligible for ORDER scope with no get criteria", () => {
      const orderScopeDiscount = {
        ...buyGetDiscount,
        scope: DiscountScope.ORDER,
        getProductIds: [],
      };
      const cartItems = [
        {
          productId: "product-1",
          categoryId: null,
          collectionIds: [],
          tagIds: [],
          quantity: 1,
        },
        {
          productId: "product-3",
          categoryId: null,
          collectionIds: [],
          tagIds: [],
          quantity: 1,
        },
      ];

      const result = checkBuyGetDiscountEligibility(orderScopeDiscount, cartItems);
      expect(result.isEligible).toBe(true);
      expect(result.getItems.length).toBe(2); // All items qualify
    });
  });

  describe("calculateStandardDiscount", () => {
    it("should calculate discount for PRODUCT scope", () => {
      const cartItems = [
        {
          productId: "product-1",
          categoryId: null,
          collectionIds: [],
          tagIds: [],
          price: 1000,
          quantity: 1,
        },
      ];

      const result = calculateStandardDiscount(mockStandardDiscount, cartItems);
      expect(result.discountAmount).toBe(200); // 20% of 1000
      expect(result.itemDiscounts.length).toBe(1);
    });

    it("should calculate discount for ORDER scope", () => {
      const orderScopeDiscount = {
        ...mockStandardDiscount,
        scope: DiscountScope.ORDER,
      };
      const cartItems = [
        {
          productId: "product-1",
          categoryId: null,
          collectionIds: [],
          tagIds: [],
          price: 500,
          quantity: 1,
        },
        {
          productId: "product-2",
          categoryId: null,
          collectionIds: [],
          tagIds: [],
          price: 500,
          quantity: 1,
        },
      ];

      const result = calculateStandardDiscount(orderScopeDiscount, cartItems);
      expect(result.discountAmount).toBe(200); // 20% of 1000
      expect(result.itemDiscounts.length).toBe(2);
    });

    it("should not apply discount to ineligible products", () => {
      const cartItems = [
        {
          productId: "product-3",
          categoryId: null,
          collectionIds: [],
          tagIds: [],
          price: 1000,
          quantity: 1,
        },
      ];

      const result = calculateStandardDiscount(mockStandardDiscount, cartItems);
      expect(result.discountAmount).toBe(0);
      expect(result.itemDiscounts.length).toBe(0);
    });
  });

  describe("calculateBuyGetDiscount", () => {
    const buyGetDiscount: DiscountResponseDto = {
      ...mockStandardDiscount,
      type: DiscountType.BUY_GET,
      buyProductIds: ["product-1"],
      getProductIds: ["product-2"],
      scope: DiscountScope.PRODUCT,
    };

    it("should calculate discount for BUY_GET type", () => {
      const cartItems = [
        {
          productId: "product-1",
          categoryId: null,
          collectionIds: [],
          tagIds: [],
          price: 500,
          quantity: 1,
        },
        {
          productId: "product-2",
          categoryId: null,
          collectionIds: [],
          tagIds: [],
          price: 1000,
          quantity: 1,
        },
      ];

      const result = calculateBuyGetDiscount(buyGetDiscount, cartItems);
      expect(result.discountAmount).toBe(200); // 20% of 1000 (get item)
      expect(result.itemDiscounts.length).toBe(1);
    });

    it("should return zero discount if not eligible", () => {
      const cartItems = [
        {
          productId: "product-1",
          categoryId: null,
          collectionIds: [],
          tagIds: [],
          price: 500,
          quantity: 1,
        },
      ];

      const result = calculateBuyGetDiscount(buyGetDiscount, cartItems);
      expect(result.discountAmount).toBe(0);
    });
  });

  describe("calculateDiscount", () => {
    it("should call calculateStandardDiscount for STANDARD type", () => {
      const cartItems = [
        {
          productId: "product-1",
          categoryId: null,
          collectionIds: [],
          tagIds: [],
          price: 1000,
          quantity: 1,
        },
      ];

      const result = calculateDiscount(mockStandardDiscount, cartItems);
      expect(result.discountAmount).toBe(200);
    });

    it("should call calculateBuyGetDiscount for BUY_GET type", () => {
      const buyGetDiscount: DiscountResponseDto = {
        ...mockStandardDiscount,
        type: DiscountType.BUY_X_GET_Y,
        buyProductIds: ["product-1"],
        getProductIds: ["product-2"],
      };
      const cartItems = [
        {
          productId: "product-1",
          categoryId: null,
          collectionIds: [],
          tagIds: [],
          price: 500,
          quantity: 1,
        },
        {
          productId: "product-2",
          categoryId: null,
          collectionIds: [],
          tagIds: [],
          price: 1000,
          quantity: 1,
        },
      ];

      const result = calculateDiscount(buyGetDiscount, cartItems);
      expect(result.discountAmount).toBe(200);
    });
  });
});

