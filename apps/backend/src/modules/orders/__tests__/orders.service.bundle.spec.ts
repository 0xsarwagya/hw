import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PinoLogger } from "nestjs-pino";
import {
  db,
  eq,
  inArray,
  cartItems,
  productVariants,
  products,
  orders,
  orderItems,
} from "@vcecom/db";
import { BundleCartItemMetadata } from "../../carts/dto/bundle-cart-item.dto";
import { OrdersService } from "../orders.service";
import { CartsService } from "../../carts/carts.service";
import { BundleEligibilityService } from "../../bundles/services/bundle-eligibility.service";
import { BundlePricingService } from "../../pricing/services/bundle-pricing.service";
import { DiscountsService } from "../../discounts/discounts.service";
import { InventoryStore } from "../../redis-store/stores/inventory-store";
import { CheckoutStore } from "../../redis-store/stores/checkout-store";
import { DiscountSnapshotValidator } from "../../discounts/services/discount-snapshot-validator.service";
import { DiscountAuditService } from "../../discounts/services/discount-audit.service";
import { DriftDetectorService } from "../../discounts/services/drift-detector.service";
import { HotReloadWatcher } from "../../discounts/services/hot-reload-watcher.service";
import { RulesetBundleService } from "../../discounts/services/ruleset-bundle.service";
import { PaymentsService } from "../../payments/payments.service";
import { PriceListService } from "../../pricing/services/price-list.service";
import { CustomerGroupService } from "../../pricing/services/customer-group.service";
import { PricingHotReloadWatcher } from "../../pricing/services/pricing-hot-reload-watcher.service";
import { PricingSnapshotValidator } from "../../pricing/services/pricing-snapshot-validator.service";
import { PricingAuditService } from "../../pricing/services/pricing-audit.service";
import { PricingDriftDetectorService } from "../../pricing/services/pricing-drift-detector.service";
import { DiscountProfiler } from "../../discounts/services/discount-profiler.service";

// Mock database
const mockDbSelect = jest.fn();
const mockDbInsert = jest.fn();
const mockDbUpdate = jest.fn();
const mockDbDelete = jest.fn();

jest.mock("@vcecom/db", () => {
  // Create a thenable object that also has limit method
  const createWhereResult = () => {
    const promise = Promise.resolve([]);
    (promise as any).limit = jest.fn(() => Promise.resolve([]));
    return promise;
  };

  // Create a chainable from result
  const createFromResult = () => ({
    where: jest.fn(() => createWhereResult()),
    limit: jest.fn(() => Promise.resolve([])),
    leftJoin: jest.fn(() => ({
      where: jest.fn(() => createWhereResult()),
    })),
    innerJoin: jest.fn(() => ({
      innerJoin: jest.fn(() => ({
        where: jest.fn(() => createWhereResult()),
      })),
      where: jest.fn(() => createWhereResult()),
    })),
  });

  return {
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
    orders: {},
    orderItems: {},
    addresses: {},
    customers: {},
  };
});

// Mock pricing engine
jest.mock("../../pricing/engine/pricing-engine", () => ({
  runPricingEngine: jest.fn(),
}));

describe("OrdersService - Bundle Integration", () => {
  let service: OrdersService;
  let bundleEligibilityService: jest.Mocked<BundleEligibilityService>;
  let bundlePricingService: jest.Mocked<BundlePricingService>;
  let inventoryStore: jest.Mocked<InventoryStore>;

  beforeEach(async () => {
    const mockBundleEligibilityService = {
      getBundle: jest.fn(),
      validateUserSelection: jest.fn(),
    };

    const mockBundlePricingService = {
      flattenBundleSelections: jest.fn(),
      calculateBundlePrice: jest.fn(),
      getBundleVariantBreakdown: jest.fn(),
    };

    const mockInventoryStore = {
      releaseCartReservations: jest.fn(),
      incrementInventory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: CartsService,
          useValue: {
            getCart: jest.fn(),
            clearCart: jest.fn(),
          },
        },
        {
          provide: BundleEligibilityService,
          useValue: mockBundleEligibilityService,
        },
        {
          provide: BundlePricingService,
          useValue: mockBundlePricingService,
        },
        {
          provide: DiscountsService,
          useValue: {
            getEligibleDiscounts: jest.fn().mockResolvedValue([]),
            findByCode: jest.fn(),
            recordUsage: jest.fn(),
          },
        },
        {
          provide: InventoryStore,
          useValue: mockInventoryStore,
        },
        {
          provide: CheckoutStore,
          useValue: {
            getOrderByPaymentIntent: jest.fn().mockResolvedValue(null),
            getSession: jest.fn(),
            getCheckoutMetadata: jest.fn(),
            createOrderFromPayment: jest.fn(),
            setOrder: jest.fn(),
            transitionState: jest.fn(),
          },
        },
        {
          provide: DiscountSnapshotValidator,
          useValue: {
            validateSnapshot: jest.fn(),
          },
        },
        {
          provide: DiscountAuditService,
          useValue: {},
        },
        {
          provide: DriftDetectorService,
          useValue: {},
        },
        {
          provide: HotReloadWatcher,
          useValue: {
            getCurrentVersion: jest.fn().mockReturnValue(1),
          },
        },
        {
          provide: RulesetBundleService,
          useValue: {
            getBundle: jest.fn(),
          },
        },
        {
          provide: PaymentsService,
          useValue: {},
        },
        {
          provide: PriceListService,
          useValue: {
            getPriceListsForCustomer: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: CustomerGroupService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: PricingHotReloadWatcher,
          useValue: {
            getCurrentVersion: jest.fn().mockReturnValue(1),
          },
        },
        {
          provide: PricingSnapshotValidator,
          useValue: {
            validate: jest.fn(),
          },
        },
        {
          provide: PricingAuditService,
          useValue: {
            logEngineRun: jest.fn(),
            logSnapshotCreated: jest.fn(),
            logSnapshotUsed: jest.fn(),
          },
        },
        {
          provide: PricingDriftDetectorService,
          useValue: {
            detectPaymentIntentDrift: jest.fn(),
            detectOrderCreationDrift: jest.fn(),
          },
        },
        {
          provide: DiscountProfiler,
          useValue: {
            recordEngineRun: jest.fn(),
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
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    bundleEligibilityService = module.get(BundleEligibilityService);
    bundlePricingService = module.get(BundlePricingService);
    inventoryStore = module.get(InventoryStore);
    jest.clearAllMocks();
  });

  describe("create - Bundle Pricing Snapshot", () => {
    it.skip("should create pricing snapshot with bundle breakdowns", async () => {
      const mockCart = {
        id: "cart-1",
        items: [
          {
            id: "item-1",
            productVariantId: "variant-1",
            quantity: 1,
            price: 100,
          },
        ],
      };

      const mockBundleCartItem = {
        id: "bundle-item-1",
        productVariantId: "variant-1",
        quantity: 2,
        price: 999.99,
        metadata: {
          type: "bundle",
          bundleId: "bundle-1",
          selections: { "set-1": ["variant-1", "variant-2"] },
        } as BundleCartItemMetadata,
      };

      jest.spyOn(service["cartsService"], "getCart").mockResolvedValue({
        ...mockCart,
        items: [...mockCart.items, mockBundleCartItem],
      } as any);

      // Mock all database queries
      const createWhereWithLimit = (result: any) => {
        const promise = Promise.resolve(result);
        (promise as any).limit = jest.fn(() => Promise.resolve(result));
        return promise;
      };
      
      (db.select as jest.Mock).mockImplementation((() => {
        let selectCallCount = 0;
        return () => {
          selectCallCount++;
        
        const createWhereResult = () => {
          const promise = Promise.resolve([]);
          (promise as any).limit = jest.fn(() => Promise.resolve([]));
          return promise;
        };
        
        const defaultFromMock = () => ({
          where: jest.fn(() => createWhereResult()),
          limit: jest.fn(() => Promise.resolve([])),
          leftJoin: jest.fn(() => ({
            where: jest.fn(() => createWhereResult()),
          })),
          innerJoin: jest.fn(() => ({
            innerJoin: jest.fn(() => ({
              where: jest.fn(() => createWhereResult()),
            })),
            where: jest.fn(() => createWhereResult()),
          })),
        });
        
        if (selectCallCount === 1) {
          return { from: jest.fn(() => ({ where: jest.fn(() => Promise.resolve([mockBundleCartItem])) })) };
        } else if (selectCallCount === 2) {
          return { from: jest.fn(() => ({ innerJoin: jest.fn(() => ({ innerJoin: jest.fn(() => ({ where: jest.fn(() => Promise.resolve([])) })) })) })) };
        } else {
          return { from: jest.fn(() => defaultFromMock()) };
        }
        };
      })());

      bundlePricingService.flattenBundleSelections.mockReturnValue([
        { variantId: "variant-1", quantity: 2 },
        { variantId: "variant-2", quantity: 2 },
      ]);

      // Mock pricing engine
      const { runPricingEngine } = require("../../pricing/engine/pricing-engine");
      (runPricingEngine as jest.Mock).mockReturnValue({
        variantPrices: [
          { variantId: "variant-1", effectivePrice: 500 },
          { variantId: "variant-2", effectivePrice: 300 },
        ],
        totalEffectivePrice: 1600,
        totalBasePrice: 1600,
        totalSavings: 0,
        appliedPriceListIds: [],
      });

      jest.spyOn(service as any, "getCustomerId").mockResolvedValue("customer-1");
      jest.spyOn(service as any, "getCustomerGroupId").mockResolvedValue(null);
      jest.spyOn(service as any, "getPriceListsForCustomer").mockResolvedValue([]);
      jest.spyOn(service as any, "getSellerState").mockReturnValue("MH");

      const checkoutStore = service["checkoutStore"] as jest.Mocked<CheckoutStore>;
      checkoutStore.getCheckoutMetadata.mockResolvedValue({
        userId: "user-1",
        shippingAddressId: "address-1",
        billingAddressId: "address-1",
        shippingCost: 0,
        discountSnapshot: null,
        pricingSnapshot: null,
        createdAt: new Date().toISOString(),
      });

      checkoutStore.getSession.mockResolvedValue({
        id: "session-1",
        state: "PAYMENT_CONFIRMED",
        cartId: "cart-1",
      } as any);

      // Mock order creation
      const mockOrder = {
        id: "order-1",
        orderNumber: "ORD-001",
      };
      const mockInsert = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockOrder]),
      });
      (db.insert as jest.Mock).mockReturnValue({ values: mockInsert });

      checkoutStore.createOrderFromPayment.mockResolvedValue("order-1");

      // Mock order items insert
      const mockOrderItemsInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });
      (db.insert as jest.Mock).mockReturnValueOnce({ values: mockInsert }).mockReturnValueOnce({
        values: mockOrderItemsInsert,
      });

      await service.finalizeOrderFromPayment("session-1", "payment-1");

      // Verify bundle was flattened for pricing
      expect(bundlePricingService.flattenBundleSelections).toHaveBeenCalled();
    });
  });

  describe("finalizeOrderFromPayment - Bundle Expansion", () => {
    it.skip("should expand bundle to multiple order items", async () => {
      const mockCart = {
        id: "cart-1",
        items: [
          {
            id: "bundle-item-1",
            productVariantId: "variant-1",
            quantity: 2,
            price: 999.99,
          },
        ],
      };

      jest.spyOn(service["cartsService"], "getCart").mockResolvedValue(mockCart as any);

      const mockBundleCartItem = {
        id: "bundle-item-1",
        productVariantId: "variant-1",
        quantity: 2,
        price: 999.99,
        metadata: {
          type: "bundle",
          bundleId: "bundle-1",
          selections: {
            "set-1": ["variant-1"],
            "set-2": ["variant-2"],
          },
        } as BundleCartItemMetadata,
      };

      // Mock all database queries
      const createWhereWithLimit2 = (result: any) => {
        const promise = Promise.resolve(result);
        (promise as any).limit = jest.fn(() => Promise.resolve(result));
        return promise;
      };
      
      const defaultFromMock2 = () => ({
        where: jest.fn(() => createWhereWithLimit2([])),
        leftJoin: jest.fn(() => ({
          where: jest.fn(() => createWhereWithLimit2([])),
        })),
        innerJoin: jest.fn(() => ({
          innerJoin: jest.fn(() => ({
            where: jest.fn(() => createWhereWithLimit2([])),
          })),
          where: jest.fn(() => createWhereWithLimit2([])),
        })),
      });
      
      (db.select as jest.Mock).mockClear();
      (db.select as jest.Mock)
        .mockReturnValueOnce({ from: jest.fn(() => ({ where: jest.fn(() => Promise.resolve([mockBundleCartItem])) })) })
        .mockReturnValueOnce({ from: jest.fn(() => ({ innerJoin: jest.fn(() => ({ innerJoin: jest.fn(() => ({ where: jest.fn(() => Promise.resolve([])) })) })) })) })
        .mockReturnValue({ from: jest.fn(() => defaultFromMock2()) });

      const mockPricingSnapshot = {
        bundleBreakdowns: [
          {
            bundleId: "bundle-1",
            bundleLineId: "bundle-item-1",
            unitBundlePrice: 999.99,
            variantBreakdown: [
              {
                variantId: "variant-1",
                unitPrice: 499.99,
                quantity: 2,
              },
              {
                variantId: "variant-2",
                unitPrice: 500.0,
                quantity: 2,
              },
            ],
          },
        ],
        variantPrices: [],
        totalEffectivePrice: 999.99,
      };

      const checkoutStore = service["checkoutStore"] as jest.Mocked<CheckoutStore>;
      checkoutStore.getCheckoutMetadata.mockResolvedValue({
        userId: "user-1",
        shippingAddressId: "address-1",
        billingAddressId: "address-1",
        shippingCost: 0,
        discountSnapshot: null,
        pricingSnapshot: mockPricingSnapshot as any,
        createdAt: new Date().toISOString(),
      });

      checkoutStore.getSession.mockResolvedValue({
        id: "session-1",
        state: "PAYMENT_CONFIRMED",
        cartId: "cart-1",
      } as any);

      jest.spyOn(service as any, "getCustomerId").mockResolvedValue("customer-1");
      jest.spyOn(service as any, "getSellerState").mockReturnValue("MH");
      jest.spyOn(service as any, "generateOrderNumber").mockResolvedValue("ORD-001");

      const mockOrder = {
        id: "order-1",
        orderNumber: "ORD-001",
      };
      const mockInsert = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockOrder]),
      });
      (db.insert as jest.Mock).mockReturnValue({ values: mockInsert });

      checkoutStore.createOrderFromPayment.mockResolvedValue("order-1");

      // Mock order items insert - should be called with multiple items
      const orderItemsValues: unknown[] = [];
      const mockOrderItemsInsert = jest.fn().mockImplementation((items) => {
        orderItemsValues.push(...items);
        return {
          returning: jest.fn().mockResolvedValue(items),
        };
      });
      (db.insert as jest.Mock).mockReturnValueOnce({ values: mockInsert }).mockReturnValueOnce({
        values: mockOrderItemsInsert,
      });

      await service.finalizeOrderFromPayment("session-1", "payment-1");

      // Verify multiple order items were created (one per bundle variant)
      expect(orderItemsValues.length).toBeGreaterThan(1);
      expect(orderItemsValues.some((item: any) => item.metadata?.isBundleComponent)).toBe(true);
    });

    it.skip("should commit inventory for all bundle variants", async () => {
      const mockCart = {
        id: "cart-1",
        items: [
          {
            id: "bundle-item-1",
            productVariantId: "variant-1",
            quantity: 2,
            price: 999.99,
          },
        ],
      };

      jest.spyOn(service["cartsService"], "getCart").mockResolvedValue(mockCart as any);

      const mockBundleCartItem = {
        id: "bundle-item-1",
        productVariantId: "variant-1",
        quantity: 2,
        price: 999.99,
        metadata: {
          type: "bundle",
          bundleId: "bundle-1",
          selections: {
            "set-1": ["variant-1", "variant-2"],
          },
        } as BundleCartItemMetadata,
      };

      // Mock all database queries
      const createWhereWithLimit3 = (result: any) => {
        const promise = Promise.resolve(result);
        (promise as any).limit = jest.fn(() => Promise.resolve(result));
        return promise;
      };
      
      const defaultFromMock3 = () => ({
        where: jest.fn(() => createWhereWithLimit3([])),
        leftJoin: jest.fn(() => ({
          where: jest.fn(() => createWhereWithLimit3([])),
        })),
        innerJoin: jest.fn(() => ({
          innerJoin: jest.fn(() => ({
            where: jest.fn(() => createWhereWithLimit3([])),
          })),
          where: jest.fn(() => createWhereWithLimit3([])),
        })),
      });
      
      (db.select as jest.Mock).mockClear();
      (db.select as jest.Mock)
        .mockReturnValueOnce({ from: jest.fn(() => ({ where: jest.fn(() => Promise.resolve([mockBundleCartItem])) })) })
        .mockReturnValueOnce({ from: jest.fn(() => ({ innerJoin: jest.fn(() => ({ innerJoin: jest.fn(() => ({ where: jest.fn(() => Promise.resolve([])) })) })) })) })
        .mockReturnValue({ from: jest.fn(() => defaultFromMock3()) });

      bundlePricingService.flattenBundleSelections.mockReturnValue([
        { variantId: "variant-1", quantity: 2 },
        { variantId: "variant-2", quantity: 2 },
      ]);

      const checkoutStore = service["checkoutStore"] as jest.Mocked<CheckoutStore>;
      checkoutStore.getCheckoutMetadata.mockResolvedValue({
        userId: "user-1",
        shippingAddressId: "address-1",
        billingAddressId: "address-1",
        shippingCost: 0,
        discountSnapshot: null,
        pricingSnapshot: {
          bundleBreakdowns: [],
          variantPrices: [],
          totalEffectivePrice: 999.99,
        } as any,
        createdAt: new Date().toISOString(),
      });

      checkoutStore.getSession.mockResolvedValue({
        id: "session-1",
        state: "PAYMENT_CONFIRMED",
        cartId: "cart-1",
      } as any);

      jest.spyOn(service as any, "getCustomerId").mockResolvedValue("customer-1");
      jest.spyOn(service as any, "getSellerState").mockReturnValue("MH");
      jest.spyOn(service as any, "generateOrderNumber").mockResolvedValue("ORD-001");

      const mockOrder = { id: "order-1", orderNumber: "ORD-001" };
      const mockInsert = jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockOrder]),
      });
      (db.insert as jest.Mock).mockReturnValue({ values: mockInsert });

      checkoutStore.createOrderFromPayment.mockResolvedValue("order-1");

      await service.finalizeOrderFromPayment("session-1", "payment-1");

      // Verify inventory was committed for all variants
      expect(bundlePricingService.flattenBundleSelections).toHaveBeenCalled();
      expect(inventoryStore.incrementInventory).toHaveBeenCalledTimes(2);
    });
  });
});

