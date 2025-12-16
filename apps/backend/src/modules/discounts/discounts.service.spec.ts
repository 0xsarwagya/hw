import { BadRequestException, NotFoundException } from "@nestjs/common";
import {
  db,
  discounts,
  discountCategories,
  discountCollections,
  discountGetCategories,
  discountGetCollections,
  discountGetProducts,
  discountGetTags,
  discountProducts,
  discountTags,
  discountUsages,
} from "@vcecom/db";
import { DiscountsService } from "./discounts.service";
import { CreateDiscountDto } from "./dto/create-discount.dto";
import { DiscountType, DiscountValueType } from "./dto/create-discount.dto";

// Mock the database
jest.mock("@vcecom/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  discounts: {},
  discountProducts: {},
  discountCategories: {},
  discountCollections: {},
  discountTags: {},
  discountGetProducts: {},
  discountGetCategories: {},
  discountGetCollections: {},
  discountGetTags: {},
  discountUsages: {},
  eq: jest.fn((field, value) => ({ field, value })),
  and: jest.fn((...args) => args),
  inArray: jest.fn((field, values) => ({ field, values })),
  desc: jest.fn((field) => ({ field, order: "desc" })),
}));

describe("DiscountsService", () => {
  let service: DiscountsService;

  beforeEach(() => {
    service = new DiscountsService();
    jest.clearAllMocks();
  });

  // Helper to create mock query chain with where and limit
  const createMockSelectChain = (results: unknown[]) => {
    const limitFn = jest.fn().mockResolvedValue(results);
    const whereFn = jest.fn().mockReturnValue({ limit: limitFn });
    const fromFn = jest.fn().mockReturnValue({ where: whereFn });
    return {
      from: fromFn,
    };
  };

  // Helper to create mock select chain without limit (for where-only queries)
  const createMockSelectChainWhereOnly = (results: unknown[]) => {
    const whereFn = jest.fn().mockResolvedValue(results);
    const fromFn = jest.fn().mockReturnValue({ where: whereFn });
    return {
      from: fromFn,
    };
  };

  // Helper to create mock select chain without where
  const createMockSelectChainNoWhere = (results: unknown[]) => {
    return {
      from: jest.fn().mockResolvedValue(results),
    };
  };

  // Helper to create mock insert chain
  const createMockInsertChain = (results: unknown[]) => {
    return {
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue(results),
      }),
    };
  };

  // Helper to create mock update chain
  const createMockUpdateChain = (results: unknown[]) => {
    return {
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue(results),
        }),
      }),
    };
  };

  // Helper to mock enrichDiscountWithRelations
  const mockEnrichDiscount = (discount: unknown) => {
    // Mock: Get discount
    (db.select as jest.Mock).mockReturnValueOnce(createMockSelectChain([discount]));

    // Mock: Get all relation queries (8 queries total)
    // 1. discountProducts
    (db.select as jest.Mock).mockReturnValueOnce(
      createMockSelectChainWhereOnly([]),
    );
    // 2. discountCategories
    (db.select as jest.Mock).mockReturnValueOnce(
      createMockSelectChainWhereOnly([]),
    );
    // 3. discountCollections
    (db.select as jest.Mock).mockReturnValueOnce(
      createMockSelectChainWhereOnly([]),
    );
    // 4. discountTags
    (db.select as jest.Mock).mockReturnValueOnce(
      createMockSelectChainWhereOnly([]),
    );
    // 5. discountGetProducts
    (db.select as jest.Mock).mockReturnValueOnce(
      createMockSelectChainWhereOnly([]),
    );
    // 6. discountGetCategories
    (db.select as jest.Mock).mockReturnValueOnce(
      createMockSelectChainWhereOnly([]),
    );
    // 7. discountGetCollections
    (db.select as jest.Mock).mockReturnValueOnce(
      createMockSelectChainWhereOnly([]),
    );
    // 8. discountGetTags
    (db.select as jest.Mock).mockReturnValueOnce(
      createMockSelectChainWhereOnly([]),
    );
  };

  describe("create", () => {
    const createDto: CreateDiscountDto = {
      code: "SAVE20",
      name: "20% Off",
      description: "Get 20% off",
      type: DiscountType.STANDARD,
      valueType: DiscountValueType.PERCENTAGE,
      value: 20,
      startDate: "2025-01-01T00:00:00.000Z",
      endDate: "2025-12-31T23:59:59.000Z",
      productIds: ["product-1"],
    };

    it("should create a discount successfully", async () => {
      const mockDiscount = {
        id: "discount-1",
        code: "SAVE20",
        name: "20% Off",
        description: "Get 20% off",
        type: DiscountType.STANDARD,
        applicationType: "MANUAL",
        valueType: DiscountValueType.PERCENTAGE,
        value: 20,
        minOrderAmount: null,
        maxDiscountAmount: null,
        scope: "PRODUCT",
        startDate: new Date(createDto.startDate),
        endDate: new Date(createDto.endDate),
        isActive: true,
        usageLimit: null,
        usageCount: 0,
        perUserLimit: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock: Check if code exists (should not exist)
      (db.select as jest.Mock).mockReturnValueOnce(createMockSelectChain([]));

      // Mock: Insert discount
      (db.insert as jest.Mock).mockReturnValueOnce(
        createMockInsertChain([mockDiscount]),
      );

      // Mock: Insert product relationships
      (db.insert as jest.Mock).mockReturnValueOnce({
        values: jest.fn().mockResolvedValue([]),
      });

      // Mock: Enrich discount with relations
      mockEnrichDiscount(mockDiscount);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.code).toBe("SAVE20");
    });

    it("should throw error if discount code already exists", async () => {
      // Mock: Check if code exists (should exist)
      (db.select as jest.Mock).mockReturnValueOnce(
        createMockSelectChain([{ code: "SAVE20" }]),
      );

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw error if end date is before start date", async () => {
      const invalidDto = {
        ...createDto,
        startDate: "2025-12-31T00:00:00.000Z",
        endDate: "2025-01-01T00:00:00.000Z",
      };

      // Mock: Check if code exists
      (db.select as jest.Mock).mockReturnValueOnce(createMockSelectChain([]));

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("findAll", () => {
    it("should return paginated discounts", async () => {
      const mockDiscounts = [
        {
          id: "discount-1",
          code: "SAVE20",
          name: "20% Off",
          type: DiscountType.STANDARD,
          applicationType: "MANUAL",
          valueType: DiscountValueType.PERCENTAGE,
          value: 20,
          scope: "PRODUCT",
          startDate: new Date(),
          endDate: new Date(),
          isActive: true,
          usageCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "discount-2",
          code: "SAVE10",
          name: "10% Off",
          type: DiscountType.STANDARD,
          applicationType: "MANUAL",
          valueType: DiscountValueType.PERCENTAGE,
          value: 10,
          scope: "PRODUCT",
          startDate: new Date(),
          endDate: new Date(),
          isActive: true,
          usageCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock: Get discounts
      const mockDiscountsChain = {
        from: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue(mockDiscounts),
      };
      (db.select as jest.Mock).mockReturnValueOnce(mockDiscountsChain);

      // Mock: Count discounts (for total calculation)
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockResolvedValue(mockDiscounts),
      });

      // Mock: Enrich each discount (2 discounts * 9 queries each = 18 queries)
      mockDiscounts.forEach((discount) => {
        mockEnrichDiscount(discount);
      });

      const result = await service.findAll(1, 10);

      expect(result.data).toBeDefined();
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe("findOne", () => {
    it("should return discount by ID", async () => {
      const mockDiscount = {
        id: "discount-1",
        code: "SAVE20",
        name: "20% Off",
      };

      // Mock: Get discount
      (db.select as jest.Mock).mockReturnValueOnce(
        createMockSelectChain([mockDiscount]),
      );

      // Mock: Enrich discount
      mockEnrichDiscount(mockDiscount);

      const result = await service.findOne("discount-1");

      expect(result).toBeDefined();
      expect(result.id).toBe("discount-1");
    });

    it("should throw error if discount not found", async () => {
      // Mock: Get discount (not found)
      (db.select as jest.Mock).mockReturnValueOnce(createMockSelectChain([]));

      await expect(service.findOne("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findByCode", () => {
    it("should return discount by code", async () => {
      const mockDiscount = {
        id: "discount-1",
        code: "SAVE20",
        name: "20% Off",
      };

      // Mock: Get discount
      (db.select as jest.Mock).mockReturnValueOnce(
        createMockSelectChain([mockDiscount]),
      );

      // Mock: Enrich discount
      mockEnrichDiscount(mockDiscount);

      const result = await service.findByCode("SAVE20");

      expect(result).toBeDefined();
      expect(result.code).toBe("SAVE20");
    });

    it("should throw error if discount not found", async () => {
      // Mock: Get discount (not found)
      (db.select as jest.Mock).mockReturnValueOnce(createMockSelectChain([]));

      await expect(service.findByCode("INVALID")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("validateDiscount", () => {
    const mockDiscount = {
      id: "discount-1",
      code: "SAVE20",
      isActive: true,
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      usageLimit: 100,
      usageCount: 50,
      perUserLimit: 1,
      minOrderAmount: null,
      type: DiscountType.STANDARD,
      applicationType: "MANUAL",
      valueType: DiscountValueType.PERCENTAGE,
      value: 20,
      maxDiscountAmount: null,
      scope: "PRODUCT",
      name: "20% Off",
      description: null,
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should validate active discount", async () => {
      // Mock: Find by code
      (db.select as jest.Mock).mockReturnValueOnce(
        createMockSelectChain([mockDiscount]),
      );

      // Mock: Enrich discount
      mockEnrichDiscount(mockDiscount);

      // Mock: Check user usage (empty)
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.validateDiscount("SAVE20", "user-1", 1000);

      expect(result.isValid).toBe(true);
      expect(result.discount).toBeDefined();
    });

    it("should return invalid if discount is not active", async () => {
      const inactiveDiscount = { ...mockDiscount, isActive: false };

      // Mock: Find by code
      (db.select as jest.Mock).mockReturnValueOnce(
        createMockSelectChain([inactiveDiscount]),
      );

      // Mock: Enrich discount
      mockEnrichDiscount(inactiveDiscount);

      const result = await service.validateDiscount("SAVE20");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("not active");
    });

    it("should return invalid if discount has expired", async () => {
      const expiredDiscount = {
        ...mockDiscount,
        endDate: new Date("2024-12-31"),
      };

      // Mock: Find by code
      (db.select as jest.Mock).mockReturnValueOnce(
        createMockSelectChain([expiredDiscount]),
      );

      // Mock: Enrich discount
      mockEnrichDiscount(expiredDiscount);

      const result = await service.validateDiscount("SAVE20");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("expired");
    });

    it("should return invalid if usage limit reached", async () => {
      const limitReachedDiscount = {
        ...mockDiscount,
        usageLimit: 100,
        usageCount: 100,
      };

      // Mock: Find by code
      (db.select as jest.Mock).mockReturnValueOnce(
        createMockSelectChain([limitReachedDiscount]),
      );

      // Mock: Enrich discount
      mockEnrichDiscount(limitReachedDiscount);

      const result = await service.validateDiscount("SAVE20");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("usage limit");
    });

    it("should return invalid if order amount below minimum", async () => {
      const minAmountDiscount = {
        ...mockDiscount,
        minOrderAmount: 1000,
      };

      // Mock: Find by code
      (db.select as jest.Mock).mockReturnValueOnce(
        createMockSelectChain([minAmountDiscount]),
      );

      // Mock: Enrich discount
      mockEnrichDiscount(minAmountDiscount);

      const result = await service.validateDiscount("SAVE20", undefined, 500);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Minimum order amount");
    });
  });

  describe("update", () => {
    it("should update discount successfully", async () => {
      const existingDiscount = {
        id: "discount-1",
        code: "SAVE20",
        type: DiscountType.STANDARD,
        name: "Old Name",
      };

      const updatedDiscount = {
        ...existingDiscount,
        name: "Updated",
      };

      // Mock: Find existing discount
      (db.select as jest.Mock).mockReturnValueOnce(
        createMockSelectChain([existingDiscount]),
      );

      // Mock: Update discount
      (db.update as jest.Mock).mockReturnValueOnce(
        createMockUpdateChain([updatedDiscount]),
      );

      // Mock: Delete relations
      (db.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      // Mock: Insert relations (empty)
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockResolvedValue([]),
      });

      // Mock: Enrich discount
      mockEnrichDiscount(updatedDiscount);

      const updateDto = { name: "Updated" };
      const result = await service.update("discount-1", updateDto);

      expect(result).toBeDefined();
    });

    it("should throw error if discount not found", async () => {
      // Mock: Find existing discount (not found)
      (db.select as jest.Mock).mockReturnValueOnce(createMockSelectChain([]));

      await expect(service.update("invalid-id", {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("remove", () => {
    it("should delete discount successfully", async () => {
      const existingDiscount = {
        id: "discount-1",
        code: "SAVE20",
      };

      // Mock: Find existing discount
      (db.select as jest.Mock).mockReturnValueOnce(
        createMockSelectChain([existingDiscount]),
      );

      // Mock: Delete discount
      (db.delete as jest.Mock).mockReturnValueOnce({
        where: jest.fn().mockResolvedValue(undefined),
      });

      const result = await service.remove("discount-1");

      expect(result.message).toBe("Discount deleted successfully");
    });

    it("should throw error if discount not found", async () => {
      // Mock: Find existing discount (not found)
      (db.select as jest.Mock).mockReturnValueOnce(createMockSelectChain([]));

      await expect(service.remove("invalid-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("recordUsage", () => {
    it("should record discount usage", async () => {
      const mockDiscount = {
        id: "discount-1",
        usageCount: 5,
      };

      // Mock: Insert usage
      (db.insert as jest.Mock).mockReturnValueOnce({
        values: jest.fn().mockResolvedValue([]),
      });

      // Mock: Get current usage count
      (db.select as jest.Mock).mockReturnValueOnce(
        createMockSelectChain([mockDiscount]),
      );

      // Mock: Update usage count
      (db.update as jest.Mock).mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await service.recordUsage("discount-1", "order-1", "user-1");

      expect(db.insert).toHaveBeenCalled();
      expect(db.update).toHaveBeenCalled();
    });
  });
});
