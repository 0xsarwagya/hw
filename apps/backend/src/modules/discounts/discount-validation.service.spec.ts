import { Test, TestingModule } from "@nestjs/testing";
import { DiscountValidationService } from "./discount-validation.service";
import { DiscountType } from "./dto/create-discount.dto";

describe("DiscountValidationService", () => {
  let service: DiscountValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiscountValidationService],
    }).compile();

    service = module.get<DiscountValidationService>(DiscountValidationService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateDiscountType", () => {
    it("should accept all valid discount types", () => {
      const validTypes = [
        DiscountType.FIXED_AMOUNT,
        DiscountType.PERCENTAGE,
        DiscountType.BUY_X_GET_Y,
        DiscountType.TIERED,
        DiscountType.CART_LEVEL,
      ];

      validTypes.forEach(type => {
        expect(() => service.validateDiscountType(type)).not.toThrow();
      });
    });

    it("should reject invalid discount types", () => {
      expect(() => service.validateDiscountType("INVALID" as any)).toThrow("Invalid discount type: INVALID");
    });
  });

  describe("validateStackingRules", () => {
    it("should allow stacking when both discounts can stack", () => {
      const discount = {
        id: "discount1",
        canStack: true,
        mutuallyExclusive: false,
        excludedDiscountIds: [],
      };

      const appliedDiscounts = [
        {
          id: "discount2",
          canStack: true,
          mutuallyExclusive: false,
        },
      ];

      expect(() => service.validateStackingRules(discount, appliedDiscounts)).not.toThrow();
    });

    it("should reject mutually exclusive discount when others are applied", () => {
      const discount = {
        id: "discount1",
        canStack: true,
        mutuallyExclusive: true,
        excludedDiscountIds: [],
      };

      const appliedDiscounts = [
        {
          id: "discount2",
          canStack: true,
          mutuallyExclusive: false,
        },
      ];

      expect(() => service.validateStackingRules(discount, appliedDiscounts))
        .toThrow("Mutually exclusive discount cannot be combined with other discounts");
    });

    it("should reject discount when mutually exclusive discount is already applied", () => {
      const discount = {
        id: "discount1",
        canStack: true,
        mutuallyExclusive: false,
        excludedDiscountIds: [],
      };

      const appliedDiscounts = [
        {
          id: "discount2",
          canStack: true,
          mutuallyExclusive: true,
        },
      ];

      expect(() => service.validateStackingRules(discount, appliedDiscounts))
        .toThrow("Cannot add discount when a mutually exclusive discount is already applied");
    });

    it("should reject non-stacking discount when another non-stacking discount is applied", () => {
      const discount = {
        id: "discount1",
        canStack: false,
        mutuallyExclusive: false,
        excludedDiscountIds: [],
      };

      const appliedDiscounts = [
        {
          id: "discount2",
          canStack: false,
          mutuallyExclusive: false,
        },
      ];

      expect(() => service.validateStackingRules(discount, appliedDiscounts))
        .toThrow("Non-stacking discount cannot be combined with other non-stacking discounts");
    });

    it("should reject discount that explicitly excludes applied discount", () => {
      const discount = {
        id: "discount1",
        canStack: true,
        mutuallyExclusive: false,
        excludedDiscountIds: ["discount2"],
      };

      const appliedDiscounts = [
        {
          id: "discount2",
          canStack: true,
          mutuallyExclusive: false,
        },
      ];

      expect(() => service.validateStackingRules(discount, appliedDiscounts))
        .toThrow("Discount conflicts with currently applied discounts");
    });
  });

  describe("validateConstraints", () => {
    it("should reject inactive discount", () => {
      const discount = {
        type: DiscountType.FIXED_AMOUNT,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
        isActive: false,
        usageCount: 0,
      };

      const context = {
        cartTotal: 1000,
        itemQuantity: 1,
      };

      expect(() => service.validateConstraints(discount, context))
        .toThrow("Discount is not active");
    });

    it("should reject discount before start date", () => {
      const discount = {
        type: DiscountType.FIXED_AMOUNT,
        startDate: new Date("2025-12-31"),
        endDate: new Date("2026-12-31"),
        isActive: true,
        usageCount: 0,
      };

      const context = {
        cartTotal: 1000,
        itemQuantity: 1,
      };

      expect(() => service.validateConstraints(discount, context))
        .toThrow("Discount has not started yet");
    });

    it("should reject expired discount", () => {
      const discount = {
        type: DiscountType.FIXED_AMOUNT,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        isActive: true,
        usageCount: 0,
      };

      const context = {
        cartTotal: 1000,
        itemQuantity: 1,
      };

      expect(() => service.validateConstraints(discount, context))
        .toThrow("Discount has expired");
    });

    it("should reject discount exceeding usage limit", () => {
      const discount = {
        type: DiscountType.FIXED_AMOUNT,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-12-31"),
        isActive: true,
        usageLimit: 100,
        usageCount: 100,
      };

      const context = {
        cartTotal: 1000,
        itemQuantity: 1,
      };

      expect(() => service.validateConstraints(discount, context))
        .toThrow("Discount usage limit exceeded");
    });

    it("should reject discount exceeding per-user limit", () => {
      const discount = {
        type: DiscountType.FIXED_AMOUNT,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-12-31"),
        isActive: true,
        usageCount: 0,
        perUserLimit: 1,
      };

      const context = {
        cartTotal: 1000,
        itemQuantity: 1,
        userUsageCount: 1,
      };

      expect(() => service.validateConstraints(discount, context))
        .toThrow("Discount per-user usage limit exceeded");
    });

    it("should reject discount below minimum order amount", () => {
      const discount = {
        type: DiscountType.CART_LEVEL,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-12-31"),
        isActive: true,
        usageCount: 0,
        minOrderAmount: 1500,
      };

      const context = {
        cartTotal: 1000,
        itemQuantity: 1,
      };

      expect(() => service.validateConstraints(discount, context))
        .toThrow("Minimum order amount of ₹1500 required");
    });

    it("should reject discount below minimum quantity", () => {
      const discount = {
        type: DiscountType.TIERED,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-12-31"),
        isActive: true,
        usageCount: 0,
        minQuantity: 3,
      };

      const context = {
        cartTotal: 1000,
        itemQuantity: 1,
      };

      expect(() => service.validateConstraints(discount, context))
        .toThrow("Minimum quantity of 3 required");
    });

    it("should reject discount for invalid customer group", () => {
      const discount = {
        type: DiscountType.FIXED_AMOUNT,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-12-31"),
        isActive: true,
        usageCount: 0,
        customerGroupIds: JSON.stringify(["vip", "premium"]),
      };

      const context = {
        cartTotal: 1000,
        itemQuantity: 1,
        customerGroupId: "basic",
      };

      expect(() => service.validateConstraints(discount, context))
        .toThrow("Discount not available for this customer group");
    });

    it("should accept valid discount", () => {
      const discount = {
        type: DiscountType.FIXED_AMOUNT,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-12-31"),
        isActive: true,
        usageCount: 0,
        minOrderAmount: 500,
        minQuantity: 1,
        customerGroupIds: JSON.stringify(["vip", "premium"]),
      };

      const context = {
        cartTotal: 1000,
        itemQuantity: 2,
        customerGroupId: "vip",
      };

      expect(() => service.validateConstraints(discount, context)).not.toThrow();
    });
  });

  describe("validateTieredRules", () => {
    it("should reject empty tiered rules", () => {
      expect(() => service.validateTieredRules([]))
        .toThrow("Tiered discount must have at least one rule");
    });

    it("should reject tiered rules with non-increasing quantities", () => {
      const rules = [
        { minQuantity: 3, value: 10, valueType: "PERCENTAGE" },
        { minQuantity: 2, value: 20, valueType: "PERCENTAGE" }, // Invalid: lower than previous
      ];

      expect(() => service.validateTieredRules(rules))
        .toThrow("Tiered rules must have increasing minimum quantities");
    });

    it("should reject negative values", () => {
      const rules = [
        { minQuantity: 1, value: -10, valueType: "PERCENTAGE" },
      ];

      expect(() => service.validateTieredRules(rules))
        .toThrow("Tiered rule values cannot be negative");
    });

    it("should reject percentage values over 100", () => {
      const rules = [
        { minQuantity: 1, value: 150, valueType: "PERCENTAGE" },
      ];

      expect(() => service.validateTieredRules(rules))
        .toThrow("Percentage values cannot exceed 100%");
    });

    it("should accept valid tiered rules", () => {
      const rules = [
        { minQuantity: 1, value: 10, valueType: "PERCENTAGE" },
        { minQuantity: 3, value: 20, valueType: "PERCENTAGE" },
        { minQuantity: 5, value: 30, valueType: "PERCENTAGE" },
      ];

      expect(() => service.validateTieredRules(rules)).not.toThrow();
    });
  });

  describe("getTieredDiscountValue", () => {
    it("should return highest applicable tier", () => {
      const rules = [
        { minQuantity: 1, value: 10, valueType: "PERCENTAGE" },
        { minQuantity: 3, value: 20, valueType: "PERCENTAGE" },
        { minQuantity: 5, value: 30, valueType: "PERCENTAGE" },
      ];

      expect(service.getTieredDiscountValue(rules, 1)).toEqual({ value: 10, valueType: "PERCENTAGE" });
      expect(service.getTieredDiscountValue(rules, 3)).toEqual({ value: 20, valueType: "PERCENTAGE" });
      expect(service.getTieredDiscountValue(rules, 5)).toEqual({ value: 30, valueType: "PERCENTAGE" });
      expect(service.getTieredDiscountValue(rules, 10)).toEqual({ value: 30, valueType: "PERCENTAGE" });
    });

    it("should throw error for quantity below minimum tier", () => {
      const rules = [
        { minQuantity: 2, value: 10, valueType: "PERCENTAGE" },
      ];

      expect(() => service.getTieredDiscountValue(rules, 1))
        .toThrow("No applicable tiered rule found for quantity");
    });
  });

  describe("validateProductLevelDiscount", () => {
    it("should return true for cart-level discount", () => {
      const discount = {
        type: DiscountType.CART_LEVEL,
      };

      const product = {
        id: "product1",
        categoryId: "category1",
        collectionIds: ["collection1"],
        tagIds: ["tag1"],
      };

      expect(service.validateProductLevelDiscount(discount, product)).toBe(true);
    });

    it("should return true for direct product match", () => {
      const discount = {
        type: DiscountType.FIXED_AMOUNT,
        productIds: ["product1", "product2"],
      };

      const product = {
        id: "product1",
        categoryId: "category1",
        collectionIds: ["collection1"],
        tagIds: ["tag1"],
      };

      expect(service.validateProductLevelDiscount(discount, product)).toBe(true);
    });

    it("should return true for category match", () => {
      const discount = {
        type: DiscountType.FIXED_AMOUNT,
        categoryIds: ["category1"],
      };

      const product = {
        id: "product1",
        categoryId: "category1",
        collectionIds: ["collection1"],
        tagIds: ["tag1"],
      };

      expect(service.validateProductLevelDiscount(discount, product)).toBe(true);
    });

    it("should return true for collection match", () => {
      const discount = {
        type: DiscountType.FIXED_AMOUNT,
        collectionIds: ["collection1"],
      };

      const product = {
        id: "product1",
        categoryId: "category1",
        collectionIds: ["collection1", "collection2"],
        tagIds: ["tag1"],
      };

      expect(service.validateProductLevelDiscount(discount, product)).toBe(true);
    });

    it("should return true for tag match", () => {
      const discount = {
        type: DiscountType.FIXED_AMOUNT,
        tagIds: ["tag1"],
      };

      const product = {
        id: "product1",
        categoryId: "category1",
        collectionIds: ["collection1"],
        tagIds: ["tag1", "tag2"],
      };

      expect(service.validateProductLevelDiscount(discount, product)).toBe(true);
    });

    it("should return false for no match", () => {
      const discount = {
        type: DiscountType.FIXED_AMOUNT,
        productIds: ["product2"],
        categoryIds: ["category2"],
        collectionIds: ["collection2"],
        tagIds: ["tag2"],
      };

      const product = {
        id: "product1",
        categoryId: "category1",
        collectionIds: ["collection1"],
        tagIds: ["tag1"],
      };

      expect(service.validateProductLevelDiscount(discount, product)).toBe(false);
    });
  });

  describe("validateBuyGetDiscount", () => {
    it("should pass for valid buy-get setup", () => {
      const discount = {
        type: DiscountType.BUY_X_GET_Y,
        buyProductIds: ["product1"],
        getProductIds: ["product2"],
      };

      const cartItems = [
        { productId: "product1", categoryId: "cat1", collectionIds: [], tagIds: [], quantity: 1 },
        { productId: "product2", categoryId: "cat2", collectionIds: [], tagIds: [], quantity: 1 },
      ];

      expect(() => service.validateBuyGetDiscount(discount, cartItems)).not.toThrow();
    });

    it("should reject when no buy items qualify", () => {
      const discount = {
        type: DiscountType.BUY_X_GET_Y,
        buyProductIds: ["product3"], // Not in cart
        getProductIds: ["product2"],
      };

      const cartItems = [
        { productId: "product1", categoryId: "cat1", collectionIds: [], tagIds: [], quantity: 1 },
        { productId: "product2", categoryId: "cat2", collectionIds: [], tagIds: [], quantity: 1 },
      ];

      expect(() => service.validateBuyGetDiscount(discount, cartItems))
        .toThrow("Buy X Get Y discount requires at least one qualifying buy item");
    });

    it("should reject when no get items qualify", () => {
      const discount = {
        type: DiscountType.BUY_X_GET_Y,
        buyProductIds: ["product1"],
        getProductIds: ["product3"], // Not in cart
      };

      const cartItems = [
        { productId: "product1", categoryId: "cat1", collectionIds: [], tagIds: [], quantity: 1 },
        { productId: "product2", categoryId: "cat2", collectionIds: [], tagIds: [], quantity: 1 },
      ];

      expect(() => service.validateBuyGetDiscount(discount, cartItems))
        .toThrow("Buy X Get Y discount requires at least one qualifying get item");
    });
  });
});
