import { DiscountApplicationType, DiscountScope, DiscountType, DiscountValueType } from "../dto/create-discount.dto";
import { DiscountResponseDto } from "../dto/discount-response.dto";
import { runDiscountEngine } from "./discount-engine";
import { DiscountEngineInput } from "./discount-engine.types";

describe("DiscountEngine", () => {
  const createMockDiscount = (
    overrides: Partial<DiscountResponseDto> = {},
  ): DiscountResponseDto => ({
    id: `discount-${Math.random().toString(36).substr(2, 9)}`,
    code: "TEST",
    name: "Test Discount",
    description: null,
    type: DiscountType.PERCENTAGE,
    applicationType: DiscountApplicationType.MANUAL,
    valueType: DiscountValueType.PERCENTAGE,
    value: 10,
    minOrderAmount: null,
    maxDiscountAmount: null,
    minQuantity: null,
    customerGroupIds: null,
    scope: DiscountScope.PRODUCT,
    priority: 1,
    canStack: true,
    mutuallyExclusive: false,
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    isActive: true,
    usageLimit: null,
    usageCount: 0,
    perUserLimit: null,
    productIds: [],
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
    ...overrides,
  });

  const createMockCartItem = (overrides: any = {}) => ({
    id: `item-${Math.random().toString(36).substr(2, 9)}`,
    productVariantId: `variant-${Math.random().toString(36).substr(2, 9)}`,
    productId: `product-${Math.random().toString(36).substr(2, 9)}`,
    categoryId: null,
    collectionIds: [],
    tagIds: [],
    price: 100,
    quantity: 1,
    ...overrides,
  });

  describe("Basic Functionality", () => {
    it("should return items unchanged when no discounts provided", () => {
      const input: DiscountEngineInput = {
        cart: {
          items: [createMockCartItem({ price: 100, quantity: 2 })],
        },
        customer: null,
        discounts: [],
        now: new Date(),
      };

      const result = runDiscountEngine(input);

      expect(result.lineItems).toHaveLength(1);
      expect(result.lineItems[0].lineTotal).toBe(200);
      expect(result.lineItems[0].discounts).toHaveLength(0);
      expect(result.discountTotal).toBe(0);
      expect(result.total).toBe(200);
    });

    it("should apply single product-level percentage discount", () => {
      const discount = createMockDiscount({
        code: "SAVE10",
        type: DiscountType.PERCENTAGE,
        valueType: DiscountValueType.PERCENTAGE,
        value: 10,
        scope: DiscountScope.PRODUCT,
      });

      const input: DiscountEngineInput = {
        cart: {
          items: [createMockCartItem({ price: 100, quantity: 1 })],
        },
        customer: null,
        discounts: [discount],
        now: new Date(),
      };

      const result = runDiscountEngine(input);

      expect(result.lineItems[0].lineTotal).toBe(90);
      expect(result.lineItems[0].discounts).toHaveLength(1);
      expect(result.lineItems[0].discounts[0].discountAmount).toBe(10);
      expect(result.discountTotal).toBe(10);
      expect(result.total).toBe(90);
    });

    it("should apply single product-level fixed amount discount", () => {
      const discount = createMockDiscount({
        code: "SAVE50",
        type: DiscountType.FIXED_AMOUNT,
        valueType: DiscountValueType.AMOUNT,
        value: 50,
        scope: DiscountScope.PRODUCT,
      });

      const input: DiscountEngineInput = {
        cart: {
          items: [createMockCartItem({ price: 100, quantity: 1 })],
        },
        customer: null,
        discounts: [discount],
        now: new Date(),
      };

      const result = runDiscountEngine(input);

      expect(result.lineItems[0].lineTotal).toBe(50);
      expect(result.discountTotal).toBe(50);
      expect(result.total).toBe(50);
    });
  });

  describe("Priority Resolution", () => {
    it("should apply highest priority discount when multiple discounts conflict", () => {
      const discount1 = createMockDiscount({
        code: "LOW_PRIORITY",
        priority: 10,
        value: 10,
        canStack: false,
      });
      const discount2 = createMockDiscount({
        code: "HIGH_PRIORITY",
        priority: 1,
        value: 20,
        canStack: false,
      });

      const input: DiscountEngineInput = {
        cart: {
          items: [createMockCartItem({ price: 100, quantity: 1 })],
        },
        customer: null,
        discounts: [discount1, discount2],
        now: new Date(),
      };

      const result = runDiscountEngine(input);

      // Higher priority (lower number) should win
      expect(result.lineItems[0].discounts).toHaveLength(1);
      expect(result.lineItems[0].discounts[0].discountCode).toBe("HIGH_PRIORITY");
      expect(result.discountTotal).toBe(20);
    });

    it("should apply multiple discounts when canStack is true", () => {
      const discount1 = createMockDiscount({
        code: "DISCOUNT1",
        priority: 1,
        value: 10,
        canStack: true,
      });
      const discount2 = createMockDiscount({
        code: "DISCOUNT2",
        priority: 2,
        value: 5,
        canStack: true,
      });

      const input: DiscountEngineInput = {
        cart: {
          items: [createMockCartItem({ price: 100, quantity: 1 })],
        },
        customer: null,
        discounts: [discount1, discount2],
        now: new Date(),
      };

      const result = runDiscountEngine(input);

      expect(result.lineItems[0].discounts).toHaveLength(2);
      expect(result.discountTotal).toBeGreaterThan(10);
    });
  });

  describe("Mutual Exclusivity", () => {
    it("should resolve mutually exclusive discounts by priority", () => {
      const discount1 = createMockDiscount({
        id: "discount-1",
        code: "EXCLUSIVE1",
        priority: 1,
        value: 20,
        mutuallyExclusive: true,
        excludedDiscountIds: ["discount-2"],
      });
      const discount2 = createMockDiscount({
        id: "discount-2",
        code: "EXCLUSIVE2",
        priority: 5,
        value: 10,
        mutuallyExclusive: true,
        excludedDiscountIds: ["discount-1"],
      });

      const input: DiscountEngineInput = {
        cart: {
          items: [createMockCartItem({ price: 100, quantity: 1 })],
        },
        customer: null,
        discounts: [discount1, discount2],
        now: new Date(),
      };

      const result = runDiscountEngine(input);

      // Higher priority discount should win
      expect(result.lineItems[0].discounts).toHaveLength(1);
      expect(result.lineItems[0].discounts[0].discountCode).toBe("EXCLUSIVE1");
      expect(result.discountTotal).toBe(20);
    });
  });

  describe("Cart-Level Discounts", () => {
    it("should apply cart-level discount after product discounts", () => {
      const productDiscount = createMockDiscount({
        code: "PRODUCT10",
        scope: DiscountScope.PRODUCT,
        value: 10,
      });
      const cartDiscount = createMockDiscount({
        code: "CART20",
        scope: DiscountScope.ORDER,
        type: DiscountType.CART_LEVEL,
        value: 20,
      });

      const input: DiscountEngineInput = {
        cart: {
          items: [createMockCartItem({ price: 100, quantity: 1 })],
        },
        customer: null,
        discounts: [productDiscount, cartDiscount],
        now: new Date(),
      };

      const result = runDiscountEngine(input);

      // Product discount: 100 * 10% = 10, new total = 90
      // Cart discount: 90 * 20% = 18, final total = 72
      expect(result.lineItems[0].discounts).toHaveLength(1);
      expect(result.cartDiscounts).toHaveLength(1);
      expect(result.total).toBeLessThan(90);
    });
  });

  describe("Determinism", () => {
    it("should produce same result for same input (100 runs)", () => {
      const discount = createMockDiscount({
        code: "TEST",
        value: 15,
      });

      const input: DiscountEngineInput = {
        cart: {
          items: [
            createMockCartItem({ price: 100, quantity: 2 }),
            createMockCartItem({ price: 50, quantity: 3 }),
          ],
        },
        customer: null,
        discounts: [discount],
        now: new Date(),
      };

      const results = Array.from({ length: 100 }, () => runDiscountEngine(input));

      // All results should be identical
      const firstResult = results[0];
      for (let i = 1; i < results.length; i++) {
        expect(results[i].total).toBe(firstResult.total);
        expect(results[i].discountTotal).toBe(firstResult.discountTotal);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should prevent negative totals", () => {
      const discount = createMockDiscount({
        code: "HUGE_DISCOUNT",
        value: 200, // More than item price
        valueType: DiscountValueType.AMOUNT,
        type: DiscountType.FIXED_AMOUNT,
      });

      const input: DiscountEngineInput = {
        cart: {
          items: [createMockCartItem({ price: 100, quantity: 1 })],
        },
        customer: null,
        discounts: [discount],
        now: new Date(),
      };

      const result = runDiscountEngine(input);

      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.lineItems[0].lineTotal).toBeGreaterThanOrEqual(0);
    });

    it("should handle zero quantity items", () => {
      const discount = createMockDiscount({
        code: "TEST",
        value: 10,
      });

      const input: DiscountEngineInput = {
        cart: {
          items: [createMockCartItem({ price: 100, quantity: 0 })],
        },
        customer: null,
        discounts: [discount],
        now: new Date(),
      };

      const result = runDiscountEngine(input);

      expect(result.lineItems[0].lineTotal).toBe(0);
      expect(result.total).toBe(0);
    });

    it("should round to 2 decimal places", () => {
      const discount = createMockDiscount({
        code: "TEST",
        value: 33.333, // Will create non-round numbers
        valueType: DiscountValueType.PERCENTAGE,
        type: DiscountType.PERCENTAGE,
      });

      const input: DiscountEngineInput = {
        cart: {
          items: [createMockCartItem({ price: 100, quantity: 1 })],
        },
        customer: null,
        discounts: [discount],
        now: new Date(),
      };

      const result = runDiscountEngine(input);

      // Check that totals are rounded to 2 decimals
      expect(result.total.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
      expect(result.lineItems[0].lineTotal.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  // Note: This is a basic test suite structure
  // Full implementation would include 150+ tests covering:
  // - All discount types (BOGO, Tiered, Cart-Level)
  // - Complex stacking scenarios
  // - Product eligibility checks
  // - Customer group restrictions
  // - Date validity
  // - Usage limits
  // - Performance tests (< 5ms for 50 items)
  // - Rounding edge cases
  // - Multiple line items
  // - Combined scenarios
});

