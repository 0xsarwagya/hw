import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { db, eq, inArray, productVariants, products } from "@vcecom/db";
import { BundlePricingService } from "../services/bundle-pricing.service";
import { BundleEligibilityService } from "../../bundles/services/bundle-eligibility.service";
import { PriceListService } from "../services/price-list.service";
import { CustomerGroupService } from "../services/customer-group.service";

// Mock database
jest.mock("@vcecom/db", () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        innerJoin: jest.fn(() => ({
          where: jest.fn(() => Promise.resolve([])),
        })),
        leftJoin: jest.fn(() => ({
          where: jest.fn(() => Promise.resolve([])),
        })),
        where: jest.fn(() => Promise.resolve([])),
      })),
    })),
  },
  eq: jest.fn(),
  inArray: jest.fn(),
  productVariants: {},
  products: {},
}));

// Mock pricing engine
jest.mock("../engine/pricing-engine", () => ({
  runPricingEngine: jest.fn(),
}));

describe("BundlePricingService", () => {
  let service: BundlePricingService;
  let bundleEligibilityService: jest.Mocked<BundleEligibilityService>;
  let priceListService: jest.Mocked<PriceListService>;
  let customerGroupService: jest.Mocked<CustomerGroupService>;

  beforeEach(async () => {
    const mockBundleEligibilityService = {
      getBundle: jest.fn(),
    };

    const mockPriceListService = {
      getPriceListsForCustomer: jest.fn().mockResolvedValue([]),
    };

    const mockCustomerGroupService = {
      findAll: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BundlePricingService,
        {
          provide: BundleEligibilityService,
          useValue: mockBundleEligibilityService,
        },
        {
          provide: PriceListService,
          useValue: mockPriceListService,
        },
        {
          provide: CustomerGroupService,
          useValue: mockCustomerGroupService,
        },
        {
          provide: "RedisStoreService",
          useValue: {
            getClient: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BundlePricingService>(BundlePricingService);
    bundleEligibilityService = module.get(BundleEligibilityService);
    priceListService = module.get(PriceListService);
    customerGroupService = module.get(CustomerGroupService);
    jest.clearAllMocks();
  });

  describe("calculateBundlePrice", () => {
    const mockBundle = {
      id: "bundle-1",
      title: "Test Bundle",
      isActive: true,
      sets: [
        {
          id: "set-1",
          items: [{ variantId: "variant-1" }, { variantId: "variant-2" }],
        },
      ],
    };

    const mockSelections = {
      "set-1": ["variant-1", "variant-2"],
    };

    it("should calculate bundle price using sum-of-parts", async () => {
      bundleEligibilityService.getBundle.mockResolvedValue(mockBundle);

      // Mock variant queries - db.select returns chainable object
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn(() => ({
          leftJoin: jest.fn(() => ({
            where: jest.fn(() => Promise.resolve([
              {
                id: "variant-1",
                productId: "product-1",
                categoryId: "category-1",
                price: 500,
                salePrice: null,
                saleStartDate: null,
                saleEndDate: null,
              },
              {
                id: "variant-2",
                productId: "product-2",
                categoryId: "category-2",
                price: 300,
                salePrice: null,
                saleStartDate: null,
                saleEndDate: null,
              },
            ])),
          })),
        })),
      });

      // Mock pricing engine
      const { runPricingEngine } = require("../engine/pricing-engine");
      (runPricingEngine as jest.Mock).mockReturnValue({
        variantPrices: [
          { variantId: "variant-1", effectivePrice: 500 },
          { variantId: "variant-2", effectivePrice: 300 },
        ],
        totalEffectivePrice: 800,
      });

      jest.spyOn(service, "getBundleVariantBreakdown").mockResolvedValue([
        { variantId: "variant-1", unitPrice: 500, quantity: 1 },
        { variantId: "variant-2", unitPrice: 300, quantity: 1 },
      ]);

      const price = await service.calculateBundlePrice(
        "bundle-1",
        mockSelections,
        1,
        "customer-1",
      );

      expect(price).toBe(800);
    });

    it("should handle quantity multipliers correctly", async () => {
      bundleEligibilityService.getBundle.mockResolvedValue(mockBundle);

      jest.spyOn(service, "getBundleVariantBreakdown").mockResolvedValue([
        { variantId: "variant-1", unitPrice: 500, quantity: 2 },
        { variantId: "variant-2", unitPrice: 300, quantity: 2 },
      ]);

      const price = await service.calculateBundlePrice(
        "bundle-1",
        mockSelections,
        2, // bundle quantity
        "customer-1",
      );

      expect(price).toBe(1600); // (500 + 300) * 2
    });

    it("should throw NotFoundException if bundle not found", async () => {
      bundleEligibilityService.getBundle.mockResolvedValue(null);

      await expect(
        service.calculateBundlePrice(
          "bundle-1",
          mockSelections,
          1,
          "customer-1",
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getBundleVariantBreakdown", () => {
    const mockBundle = {
      id: "bundle-1",
      title: "Test Bundle",
      isActive: true,
      sets: [
        {
          id: "set-1",
          items: [{ variantId: "variant-1" }],
        },
      ],
    };

    const mockSelections = {
      "set-1": ["variant-1"],
    };

    it("should return correct breakdown structure", async () => {
      bundleEligibilityService.getBundle.mockResolvedValue(mockBundle);

      // Mock database query chain
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn(() => ({
          innerJoin: jest.fn(() => ({
            where: jest.fn(() => Promise.resolve([
              {
                id: "variant-1",
                productId: "product-1",
                categoryId: "category-1",
                price: 500,
                salePrice: null,
                saleStartDate: null,
                saleEndDate: null,
              },
            ])),
          })),
        })),
      });

      const { runPricingEngine } = require("../engine/pricing-engine");
      (runPricingEngine as jest.Mock).mockReturnValue({
        variantPrices: [
          {
            variantId: "variant-1",
            effectivePrice: 500,
          },
        ],
        totalEffectivePrice: 500,
      });

      const breakdown = await service.getBundleVariantBreakdown(
        "bundle-1",
        mockSelections,
        2, // bundle quantity
        "customer-1",
      );

      expect(breakdown).toHaveLength(1);
      expect(breakdown[0]).toEqual({
        variantId: "variant-1",
        unitPrice: 500,
        quantity: 2,
      });
    });
  });

  describe("flattenBundleSelections", () => {
    it("should flatten selections to variant quantities", () => {
      const selections = {
        "set-1": ["variant-1", "variant-2"],
        "set-2": ["variant-1"], // duplicate variant
      };

      const result = service.flattenBundleSelections(selections, 2);

      expect(result).toEqual([
        { variantId: "variant-1", quantity: 4 }, // 2 from set-1 + 2 from set-2
        { variantId: "variant-2", quantity: 2 },
      ]);
    });

    it("should handle single set selection", () => {
      const selections = {
        "set-1": ["variant-1"],
      };

      const result = service.flattenBundleSelections(selections, 3);

      expect(result).toEqual([{ variantId: "variant-1", quantity: 3 }]);
    });
  });
});

