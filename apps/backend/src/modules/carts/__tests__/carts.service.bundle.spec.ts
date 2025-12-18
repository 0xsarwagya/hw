import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { db, eq, cartItems, productVariants, products } from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import { BundleCartItemMetadata } from "../dto/bundle-cart-item.dto";
import { CartsService } from "../carts.service";
import { BundleEligibilityService } from "../../bundles/services/bundle-eligibility.service";
import { BundleDefinitionService } from "../../bundles/services/bundle-definition.service";
import { BundlePricingService } from "../../pricing/services/bundle-pricing.service";
import { DiscountsService } from "../../discounts/discounts.service";
import { InventoryStore } from "../../redis-store/stores/inventory-store";
import { CheckoutStore } from "../../redis-store/stores/checkout-store";
import { DiscountAuditService } from "../../discounts/services/discount-audit.service";
import { DiscountProfiler } from "../../discounts/services/discount-profiler.service";
import { HotReloadWatcher } from "../../discounts/services/hot-reload-watcher.service";

// Mock database
jest.mock("@vcecom/db", () => {
  // Create a thenable object that also has limit method
  const createWhereResult = () => {
    const promise = Promise.resolve([]);
    (promise as any).limit = jest.fn(() => Promise.resolve([]));
    return promise;
  };

  // Create a chainable from result
  const createFromResult = () => ({
    where: jest.fn(() => {
      const result = Promise.resolve([]);
      (result as any).limit = jest.fn(() => Promise.resolve([]));
      return result;
    }),
    limit: jest.fn(() => Promise.resolve([])),
    leftJoin: jest.fn(() => ({
      where: jest.fn(() => createWhereResult()),
    })),
    innerJoin: jest.fn(() => ({
      innerJoin: jest.fn(() => ({
        where: jest.fn(() => createWhereResult()),
      })),
      where: jest.fn(() => {
        const result = Promise.resolve([]);
        (result as any).limit = jest.fn(() => Promise.resolve([]));
        return result;
      }),
    })),
  });

  return {
    db: {
      select: jest.fn(() => ({
        from: jest.fn(() => createFromResult()),
      })),
      insert: jest.fn(() => ({
        values: jest.fn(() => ({
          returning: jest.fn(() => Promise.resolve([])),
        })),
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => Promise.resolve([])),
        })),
      })),
      delete: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve([])),
      })),
    },
    eq: jest.fn(),
    and: jest.fn(),
    inArray: jest.fn(),
    cartItems: {},
    productVariants: {},
    products: {},
    carts: {},
    addresses: {},
  };
});

describe("CartsService - Bundle Integration", () => {
  let service: CartsService;
  let module: TestingModule;
  let bundleEligibilityService: jest.Mocked<BundleEligibilityService>;
  let bundlePricingService: jest.Mocked<BundlePricingService>;
  let bundleDefinitionService: jest.Mocked<BundleDefinitionService>;
  let inventoryStore: jest.Mocked<InventoryStore>;

  beforeEach(async () => {
    const mockBundleEligibilityService = {
      getBundle: jest.fn(),
      validateUserSelection: jest.fn(),
    };

    const mockBundleDefinitionService = {
      findOne: jest.fn(),
    };

    const mockBundlePricingService = {
      flattenBundleSelections: jest.fn(),
      calculateBundlePrice: jest.fn(),
      getBundleVariantBreakdown: jest.fn(),
    };

    const mockInventoryStore = {
      getAvailableInventory: jest.fn(),
      getReservedInventory: jest.fn(),
      reserveInventory: jest.fn(),
      refreshReservationTTL: jest.fn(),
      getReservation: jest.fn(),
      releaseInventory: jest.fn(),
      delete: jest.fn(),
      releaseCartReservations: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        CartsService,
        {
          provide: BundleEligibilityService,
          useValue: mockBundleEligibilityService,
        },
        {
          provide: BundleDefinitionService,
          useValue: mockBundleDefinitionService,
        },
        {
          provide: BundlePricingService,
          useValue: mockBundlePricingService,
        },
        {
          provide: DiscountsService,
          useValue: {
            getEligibleDiscounts: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: InventoryStore,
          useValue: mockInventoryStore,
        },
        {
          provide: CheckoutStore,
          useValue: {
            isCheckoutLocked: jest.fn().mockResolvedValue(false),
          },
        },
        {
          provide: DiscountAuditService,
          useValue: {},
        },
        {
          provide: DiscountProfiler,
          useValue: {},
        },
        {
          provide: HotReloadWatcher,
          useValue: {
            getCurrentVersion: jest.fn().mockReturnValue(1),
          },
        },
        {
          provide: PinoLogger,
          useValue: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            logger: {
              child: jest.fn().mockReturnThis(),
            },
          },
        },
        {
          provide: ContextService,
          useValue: {
            run: jest.fn((context, fn) => fn()),
            get: jest.fn(),
            getValue: jest.fn(),
            setValue: jest.fn(),
            getRequestId: jest.fn(),
            getTraceId: jest.fn(),
            getSpanId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CartsService>(CartsService);
    bundleEligibilityService = module.get(BundleEligibilityService);
    bundlePricingService = module.get(BundlePricingService);
    bundleDefinitionService = module.get(BundleDefinitionService);
    inventoryStore = module.get(InventoryStore);
    jest.clearAllMocks();
  });

  describe("addItem - Bundle", () => {
    const mockBundle = {
      id: "bundle-1",
      title: "Test Bundle",
      isActive: true,
      allowMixAndMatch: false,
      sets: [
        {
          id: "set-1",
          title: "Choose T-shirt",
          minQuantity: 1,
          maxQuantity: 1,
          items: [{ variantId: "variant-1" }, { variantId: "variant-2" }],
        },
      ],
    };

    const mockSelections = {
      "set-1": ["variant-1"],
    };

    it("should add bundle to cart successfully", async () => {
      // Mock cart
      const mockCart = { id: "cart-1", customerId: "customer-1" };
      jest.spyOn(service as any, "getOrCreateCart").mockResolvedValue(mockCart);
      jest.spyOn(service as any, "getCustomerId").mockResolvedValue("customer-1");

      // Mock bundle validation
      bundleEligibilityService.getBundle.mockResolvedValue(mockBundle);
      (bundleDefinitionService.findOne as jest.Mock).mockResolvedValue(mockBundle);
      bundleEligibilityService.validateUserSelection.mockResolvedValue({
        isValid: true,
        errors: [],
      });

      // Mock flattening
      bundlePricingService.flattenBundleSelections.mockReturnValue([
        { variantId: "variant-1", quantity: 2 },
      ]);

      // Mock inventory
      inventoryStore.getAvailableInventory.mockResolvedValue(10);
      inventoryStore.getReservedInventory.mockResolvedValue(0);

      // Mock pricing
      bundlePricingService.calculateBundlePrice.mockResolvedValue(999.99);

      // Mock database insert
      const mockInsert = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: "item-1" }]),
      });
      (db.insert as jest.Mock).mockReturnValue({ values: mockInsert });

      // Mock recalculateCartTotals to avoid database calls
      jest.spyOn(service as any, "recalculateCartTotals").mockResolvedValue({
        gstAmount: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
      });

      // Mock getCart
      jest.spyOn(service, "getCart").mockResolvedValue({
        id: "cart-1",
        items: [],
        subtotal: 0,
        total: 0,
      } as any);

      const result = await service.addItem("user-1", null, {
        type: "bundle",
        bundleId: "bundle-1",
        selections: mockSelections,
        quantity: 2,
      });

      // Bundle definition is fetched via BundleDefinitionService.findOne
      expect(bundleEligibilityService.validateUserSelection).toHaveBeenCalledWith(
        "bundle-1",
        mockSelections,
      );
      expect(bundlePricingService.flattenBundleSelections).toHaveBeenCalled();
      expect(inventoryStore.reserveInventory).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should reject bundle with invalid selections", async () => {
      const mockCart = { id: "cart-1", customerId: "customer-1" };
      jest.spyOn(service as any, "getOrCreateCart").mockResolvedValue(mockCart);
      jest.spyOn(service as any, "getCustomerId").mockResolvedValue("customer-1");

      bundleEligibilityService.getBundle.mockResolvedValue(mockBundle);
      (bundleDefinitionService.findOne as jest.Mock).mockResolvedValue(mockBundle);
      bundleEligibilityService.validateUserSelection.mockResolvedValue({
        isValid: false,
        errors: ["Invalid variant selection"],
      });

      await expect(
        service.addItem("user-1", null, {
          type: "bundle",
          bundleId: "bundle-1",
          selections: { "set-1": ["invalid-variant"] },
          quantity: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject inactive bundle", async () => {
      const mockCart = { id: "cart-1", customerId: "customer-1" };
      jest.spyOn(service as any, "getOrCreateCart").mockResolvedValue(mockCart);
      jest.spyOn(service as any, "getCustomerId").mockResolvedValue("customer-1");

      const inactiveBundle = {
        ...mockBundle,
        isActive: false,
      };
      bundleEligibilityService.getBundle.mockResolvedValue(inactiveBundle);
      (bundleDefinitionService.findOne as jest.Mock).mockResolvedValue(inactiveBundle);

      await expect(
        service.addItem("user-1", null, {
          type: "bundle",
          bundleId: "bundle-1",
          selections: mockSelections,
          quantity: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reserve inventory for all bundle variants", async () => {
      const mockCart = { id: "cart-1", customerId: "customer-1" };
      jest.spyOn(service as any, "getOrCreateCart").mockResolvedValue(mockCart);
      jest.spyOn(service as any, "getCustomerId").mockResolvedValue("customer-1");

      bundleEligibilityService.getBundle.mockResolvedValue(mockBundle);
      (bundleDefinitionService.findOne as jest.Mock).mockResolvedValue(mockBundle);
      bundleEligibilityService.validateUserSelection.mockResolvedValue({
        isValid: true,
        errors: [],
      });

      bundlePricingService.flattenBundleSelections.mockReturnValue([
        { variantId: "variant-1", quantity: 2 },
        { variantId: "variant-2", quantity: 2 },
      ]);

      inventoryStore.getAvailableInventory.mockResolvedValue(10);
      inventoryStore.getReservedInventory.mockResolvedValue(0);
      bundlePricingService.calculateBundlePrice.mockResolvedValue(1999.98);

      const mockInsert = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: "item-1" }]),
      });
      (db.insert as jest.Mock).mockReturnValue({ values: mockInsert });

      jest.spyOn(service as any, "recalculateCartTotals").mockResolvedValue({
        gstAmount: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
      });

      jest.spyOn(service, "getCart").mockResolvedValue({
        id: "cart-1",
        items: [],
        subtotal: 0,
        total: 0,
      } as any);

      await service.addItem("user-1", null, {
        type: "bundle",
        bundleId: "bundle-1",
        selections: mockSelections,
        quantity: 2,
      });

      expect(inventoryStore.reserveInventory).toHaveBeenCalledTimes(2);
      expect(inventoryStore.reserveInventory).toHaveBeenCalledWith(
        "cart-1",
        "variant-1",
        2,
      );
      expect(inventoryStore.reserveInventory).toHaveBeenCalledWith(
        "cart-1",
        "variant-2",
        2,
      );
    });
  });

  describe("updateItem - Bundle", () => {
    it("should update bundle quantity successfully", async () => {
      const mockCart = { id: "cart-1", customerId: "customer-1" };
      jest.spyOn(service as any, "getOrCreateCart").mockResolvedValue(mockCart);
      jest.spyOn(service as any, "getCustomerId").mockResolvedValue("customer-1");

      const mockItem = {
        id: "item-1",
        productVariantId: "variant-1",
        quantity: 2,
        metadata: {
          type: "bundle",
          bundleId: "bundle-1",
          selections: { "set-1": ["variant-1"] },
        } as BundleCartItemMetadata,
      };

      // Mock database select chain
      const mockSelectChain = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve([mockItem])),
          })),
        })),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelectChain);

      bundlePricingService.flattenBundleSelections.mockReturnValue([
        { variantId: "variant-1", quantity: 3 },
      ]);

      inventoryStore.getAvailableInventory.mockResolvedValue(10);
      inventoryStore.getReservedInventory.mockResolvedValue(0);
      bundlePricingService.calculateBundlePrice.mockResolvedValue(1499.99);

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });
      (db.update as jest.Mock).mockReturnValue(mockUpdate());

      jest.spyOn(service as any, "recalculateCartTotals").mockResolvedValue({
        gstAmount: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
      });

      jest.spyOn(service, "getCart").mockResolvedValue({
        id: "cart-1",
        items: [],
        subtotal: 0,
        total: 0,
      } as any);

      await service.updateItem("user-1", null, "item-1", { quantity: 3 });

      expect(bundlePricingService.flattenBundleSelections).toHaveBeenCalled();
      expect(inventoryStore.reserveInventory).toHaveBeenCalled();
    });
  });

  describe("removeItem - Bundle", () => {
    it("should release all variant reservations for bundle", async () => {
      const mockCart = { id: "cart-1", customerId: "customer-1" };
      jest.spyOn(service as any, "getOrCreateCart").mockResolvedValue(mockCart);
      jest.spyOn(service as any, "getCustomerId").mockResolvedValue("customer-1");

      const mockItem = {
        id: "item-1",
        productVariantId: "variant-1",
        quantity: 2,
        metadata: {
          type: "bundle",
          bundleId: "bundle-1",
          selections: {
            "set-1": ["variant-1"],
            "set-2": ["variant-2"],
          },
        } as BundleCartItemMetadata,
      };

      // Mock database select chain
      const mockSelectChain = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve([mockItem])),
          })),
        })),
      };
      (db.select as jest.Mock).mockReturnValue(mockSelectChain);

      bundlePricingService.flattenBundleSelections.mockReturnValue([
        { variantId: "variant-1", quantity: 2 },
        { variantId: "variant-2", quantity: 2 },
      ]);

      inventoryStore.getReservation.mockResolvedValue(2);
      inventoryStore.delete.mockResolvedValue(undefined);
      inventoryStore.releaseInventory.mockResolvedValue(undefined);

      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });
      (db.delete as jest.Mock).mockReturnValue(mockDelete());

      jest.spyOn(service as any, "recalculateCartTotals").mockResolvedValue({
        gstAmount: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
      });

      jest.spyOn(service, "getCart").mockResolvedValue({
        id: "cart-1",
        items: [],
        subtotal: 0,
        total: 0,
      } as any);

      await service.removeItem("user-1", null, "item-1");

      expect(bundlePricingService.flattenBundleSelections).toHaveBeenCalled();
      expect(inventoryStore.getReservation).toHaveBeenCalledTimes(2);
      expect(inventoryStore.releaseInventory).toHaveBeenCalledTimes(2);
    });
  });

  describe("getCart - Bundle Hydration", () => {
    it("should hydrate bundle items with full structure", async () => {
      const mockCart = { id: "cart-1", customerId: "customer-1" };
      jest.spyOn(service as any, "getOrCreateCart").mockResolvedValue(mockCart);
      jest.spyOn(service as any, "getCustomerId").mockResolvedValue("customer-1");

      const mockBundleItem = {
        id: "item-1",
        productVariantId: "variant-1",
        quantity: 2,
        price: 999.99,
        metadata: {
          type: "bundle",
          bundleId: "bundle-1",
          selections: { "set-1": ["variant-1"] },
        } as BundleCartItemMetadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database queries
      // First call: get cart items (line 635-638 of carts.service.ts)
      const mockSelectItems = {
        from: jest.fn(() => ({
          where: jest.fn(() => Promise.resolve([mockBundleItem])),
        })),
      };
      // Second call: get updated cart (line 660-664 of carts.service.ts)
      const mockSelectCart = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve([{ ...mockCart, subtotal: 0, gstAmount: 0, total: 0, discountCode: null, discountAmount: 0 }])),
          })),
        })),
      };
      // Mock for getCartById call (third select)
      const mockSelectCartById = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                id: "cart-1",
                customerId: "customer-1",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockSelectItems)
        .mockReturnValueOnce(mockSelectCart)
        .mockReturnValueOnce(mockSelectCartById);

      const mockBundle = {
        id: "bundle-1",
        title: "Test Bundle",
        isActive: true,
        sets: [],
      };
      bundleEligibilityService.getBundle.mockResolvedValue(mockBundle);
      (bundleDefinitionService.findOne as jest.Mock).mockResolvedValue(mockBundle);

      bundlePricingService.getBundleVariantBreakdown.mockResolvedValue([
        {
          variantId: "variant-1",
          unitPrice: 499.99,
          quantity: 2,
        },
      ]);

      jest.spyOn(service as any, "recalculateCartTotals").mockResolvedValue({
        gstAmount: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
      });

      const result = await service.getCart("user-1", null);

      expect(result.items).toBeDefined();
      expect(result.items[0].type).toBe("bundle");
      expect(result.items[0].bundleId).toBe("bundle-1");
      expect(result.items[0].bundleVariantBreakdown).toBeDefined();
    });

    it("should throw error if bundle is no longer active", async () => {
      const mockCart = { id: "cart-1", customerId: "customer-1" };
      jest.spyOn(service as any, "getOrCreateCart").mockResolvedValue(mockCart);
      jest.spyOn(service as any, "getCustomerId").mockResolvedValue("customer-1");

      const mockBundleItem = {
        id: "item-1",
        productVariantId: "variant-1",
        quantity: 2,
        price: 999.99,
        metadata: {
          type: "bundle",
          bundleId: "bundle-1",
          selections: { "set-1": ["variant-1"] },
        } as BundleCartItemMetadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock database queries
      // First call: getCartById - get cart
      const mockSelectCartById2 = {
        from: jest.fn(() => ({
          where: jest.fn(() => {
            const result = Promise.resolve([{ ...mockCart, subtotal: 0, gstAmount: 0, total: 0, discountCode: null, discountAmount: 0 }]);
            (result as any).limit = jest.fn(() => Promise.resolve([{ ...mockCart, subtotal: 0, gstAmount: 0, total: 0, discountCode: null, discountAmount: 0 }]));
            return result;
          }),
        })),
      };
      // Second call: get cart items
      const mockSelectItems2 = {
        from: jest.fn(() => ({
          where: jest.fn(() => Promise.resolve([mockBundleItem])),
        })),
      };
      // Third call: get updated cart (won't be reached due to error, but needed for mock)
      const mockSelectCart2 = {
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve([{ ...mockCart, subtotal: 0, gstAmount: 0, total: 0, discountCode: null, discountAmount: 0 }])),
          })),
        })),
      };
      (db.select as jest.Mock)
        .mockReturnValueOnce(mockSelectCartById2)
        .mockReturnValueOnce(mockSelectItems2)
        .mockReturnValueOnce(mockSelectCart2);

      const inactiveBundle = {
        id: "bundle-1",
        title: "Test Bundle",
        isActive: false, // Inactive bundle
        sets: [],
      };
      bundleEligibilityService.getBundle.mockResolvedValue(inactiveBundle);
      (bundleDefinitionService.findOne as jest.Mock).mockResolvedValue(inactiveBundle);

      await expect(service.getCart("user-1", null)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

