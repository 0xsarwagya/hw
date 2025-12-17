import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../common/logging/context.service";
import {
  addresses,
  cartItems,
  carts,
  customers,
  db,
  eq,
  inArray,
  orderItems,
  orders,
  payments,
  productVariants,
  products,
  shipments,
  users,
} from "@vcecom/db";
import { CartsService } from "../carts/carts.service";
import { DiscountAuditService } from "../discounts/services/discount-audit.service";
import { DiscountSnapshotValidator } from "../discounts/services/discount-snapshot-validator.service";
import { DriftDetectorService } from "../discounts/services/drift-detector.service";
import { DiscountsService } from "../discounts/discounts.service";
import { HotReloadWatcher } from "../discounts/services/hot-reload-watcher.service";
import { RulesetBundleService } from "../discounts/services/ruleset-bundle.service";
import { DiscountProfiler } from "../discounts/services/discount-profiler.service";
import { PricingHotReloadWatcher } from "../pricing/services/pricing-hot-reload-watcher.service";
import { PriceListService } from "../pricing/services/price-list.service";
import { CustomerGroupService } from "../pricing/services/customer-group.service";
import { PricingSnapshotValidator } from "../pricing/services/pricing-snapshot-validator.service";
import { PricingAuditService } from "../pricing/services/pricing-audit.service";
import { PricingDriftDetectorService } from "../pricing/services/pricing-drift-detector.service";
import { BundleEligibilityService } from "../bundles/services/bundle-eligibility.service";
import { BundlePricingService } from "../pricing/services/bundle-pricing.service";
import { PaymentsService } from "../payments/payments.service";
import { CheckoutState } from "../redis-store/constants/checkout-states";
import {
  PaymentIntent,
  PaymentIntentStatus,
} from "../redis-store/dto/payment-intent.dto";
import { CheckoutStore } from "../redis-store/stores/checkout-store";
import { IdempotencyStore } from "../redis-store/stores/idempotency-store";
import { InventoryStore } from "../redis-store/stores/inventory-store";
import { OrderStatus } from "./dto/update-order-status.dto";
import { OrdersService } from "./orders.service";

// Helper function to create properly chained db.select mocks
function createSelectMock(returnValue: any) {
  return {
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(returnValue),
      }),
    }),
  };
}

function createSelectMockWithOrderBy(returnValue: any) {
  return {
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(returnValue),
        }),
      }),
    }),
  };
}

function createSelectMockWithInnerJoin(returnValue: any) {
  const afterSecondJoin = {
    where: jest.fn().mockResolvedValue(returnValue),
  };
  const afterFirstJoin = {
    innerJoin: jest.fn().mockReturnValue(afterSecondJoin),
  };
  const fromResult = {
    innerJoin: jest.fn().mockReturnValue(afterFirstJoin),
  };
  return {
    from: jest.fn().mockReturnValue(fromResult),
  };
}

// Mock dependencies
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
    ilike: jest.fn(),
    desc: jest.fn(),
    inArray: jest.fn(),
    sql: jest.fn(),
    addresses: {},
    cartItems: {},
    carts: {},
    customers: {},
    orderItems: {},
    orders: {},
    payments: {},
    productVariants: {},
    products: {},
    shipments: {},
    users: {},
  };
});

describe("OrdersService", () => {
  let service: OrdersService;
  let cartsService: CartsService;
  let discountsService: DiscountsService;
  let inventoryStore: InventoryStore;
  let idempotencyStore: IdempotencyStore;
  let checkoutStore: CheckoutStore;
  let paymentsService: PaymentsService;

  const mockUserId = "user-123";
  const mockCustomerId = "customer-123";
  const mockShippingAddressId = "shipping-address-123";
  const mockBillingAddressId = "billing-address-123";
  const mockCartId = "cart-123";
  const mockOrderId = "order-123";
  const mockProductId = "product-123";
  const mockVariantId = "variant-123";

  const mockCustomer = {
    id: mockCustomerId,
    userId: mockUserId,
    email: "test@example.com",
    phone: "1234567890",
    name: "Test Customer",
  };

  const mockShippingAddress = {
    id: mockShippingAddressId,
    customerId: mockCustomerId,
    type: "shipping" as const,
    street: "123 Main St",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    district: "Mumbai",
    country: "India",
    isDefault: true,
  };

  const mockBillingAddress = {
    id: mockBillingAddressId,
    customerId: mockCustomerId,
    type: "billing" as const,
    street: "456 Billing St",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    district: "Mumbai",
    country: "India",
    isDefault: false,
  };

  const mockCart = {
    id: mockCartId,
    customerId: mockCustomerId,
    sessionId: null,
    subtotal: 1000,
    gstAmount: 180,
    total: 1180,
    expiresAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: "cart-item-123",
        cartId: mockCartId,
        productVariantId: mockVariantId,
        quantity: 2,
        price: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const mockProduct = {
    id: mockProductId,
    title: "Test Product",
    description: "Test Description",
    price: 500,
    gstRate: 18,
    hsnCode: "123456",
    status: "active" as const,
    categoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockVariant = {
    id: mockVariantId,
    productId: mockProductId,
    sku: "SKU-001",
    price: 500,
    inventory: 10,
    size: null,
    color: null,
    weight: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        CartsService,
        DiscountsService,
        InventoryStore,
        IdempotencyStore,
        CheckoutStore,
        PaymentsService,
        DiscountSnapshotValidator,
        DiscountAuditService,
        DriftDetectorService,
        HotReloadWatcher,
        RulesetBundleService,
        DiscountProfiler,
        PricingHotReloadWatcher,
        PriceListService,
        CustomerGroupService,
        PricingSnapshotValidator,
        PricingAuditService,
        PricingDriftDetectorService,
        BundleEligibilityService,
        BundlePricingService,
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
    })
      .overrideProvider(CartsService)
      .useValue({
        getCart: jest.fn(),
        clearCart: jest.fn(),
      })
      .overrideProvider(DiscountsService)
      .useValue({
        validateDiscount: jest.fn(),
        findByCode: jest.fn(),
        recordUsage: jest.fn(),
      })
      .overrideProvider(InventoryStore)
      .useValue({
        getAvailableInventory: jest.fn(),
        getReservedInventory: jest.fn(),
        reserveInventory: jest.fn(),
        releaseInventory: jest.fn(),
        commitReservation: jest.fn(),
        incrementInventory: jest.fn(),
        releaseCartReservations: jest.fn(),
      })
      .overrideProvider(IdempotencyStore)
      .useValue({
        getIdempotencyResult: jest.fn(),
        checkAndSet: jest.fn(),
        set: jest.fn(),
        deleteIdempotency: jest.fn(),
      })
      .overrideProvider(CheckoutStore)
      .useValue({
        acquireCheckoutLock: jest.fn(),
        releaseCheckoutLock: jest.fn(),
        isCheckoutLocked: jest.fn(),
        createSession: jest.fn(),
        transitionState: jest.fn(),
        setOrder: jest.fn(),
        failSession: jest.fn(),
        assertStateIn: jest.fn(),
        assertState: jest.fn(),
        getSession: jest.fn(),
        storeCheckoutMetadata: jest.fn(),
        getCheckoutMetadata: jest.fn(),
        createOrderFromPayment: jest.fn(),
        getOrderByPaymentIntent: jest.fn(),
        getPaymentIntent: jest.fn(),
      })
      .overrideProvider(PaymentsService)
      .useValue({
        createPaymentIntent: jest.fn(),
      })
      .overrideProvider(DiscountSnapshotValidator)
      .useValue({
        validateSnapshot: jest.fn(),
      })
      .overrideProvider(DiscountAuditService)
      .useValue({
        logEvent: jest.fn(),
        logEngineRun: jest.fn(),
        logSnapshotCreated: jest.fn(),
        logSnapshotUsed: jest.fn(),
        logDrift: jest.fn(),
      })
      .overrideProvider(DriftDetectorService)
      .useValue({
        detectPaymentIntentDrift: jest.fn(),
        detectWebhookDrift: jest.fn(),
        detectOrderCreationDrift: jest.fn(),
      })
      .overrideProvider(HotReloadWatcher)
      .useValue({
        getCurrentVersion: jest.fn().mockReturnValue(1),
        getCurrentBundle: jest.fn(),
      })
      .overrideProvider(RulesetBundleService)
      .useValue({
        getBundle: jest.fn(),
        getCurrentBundle: jest.fn(),
      })
      .overrideProvider(DiscountProfiler)
      .useValue({
        recordEngineRun: jest.fn(),
        recordRedisLatency: jest.fn(),
        recordCacheHit: jest.fn(),
        recordCacheMiss: jest.fn(),
        recordHotReload: jest.fn(),
        updateRulesetInfo: jest.fn(),
        getMetrics: jest.fn(),
      })
      .overrideProvider(PricingHotReloadWatcher)
      .useValue({
        getCurrentVersion: jest.fn().mockReturnValue(1),
        getCurrentBundle: jest.fn(),
      })
      .overrideProvider(PriceListService)
      .useValue({
        findOne: jest.fn(),
        findActive: jest.fn().mockResolvedValue([]),
      })
      .overrideProvider(CustomerGroupService)
      .useValue({
        findOne: jest.fn(),
      })
      .overrideProvider(PricingSnapshotValidator)
      .useValue({
        validateSnapshot: jest.fn(),
        validate: jest.fn(),
      })
      .overrideProvider(PricingAuditService)
      .useValue({
        logEngineRun: jest.fn(),
        logSnapshotCreated: jest.fn(),
        logSnapshotUsed: jest.fn(),
        logEvent: jest.fn(),
      })
      .overrideProvider(PricingDriftDetectorService)
      .useValue({
        detectPaymentIntentDrift: jest.fn(),
        detectOrderCreationDrift: jest.fn(),
      })
      .overrideProvider(BundleEligibilityService)
      .useValue({
        getBundle: jest.fn(),
        validateUserSelection: jest.fn(),
      })
      .overrideProvider(BundlePricingService)
      .useValue({
        flattenBundleSelections: jest.fn(),
        calculateBundlePrice: jest.fn(),
        getBundleVariantBreakdown: jest.fn(),
      })
      .compile();

    service = module.get<OrdersService>(OrdersService);
    cartsService = module.get<CartsService>(CartsService);
    discountsService = module.get<DiscountsService>(DiscountsService);
    inventoryStore = module.get<InventoryStore>(InventoryStore);
    idempotencyStore = module.get<IdempotencyStore>(IdempotencyStore);
    checkoutStore = module.get<CheckoutStore>(CheckoutStore);
    paymentsService = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Don't restore default mock - let each test set up its own mocks
    // This prevents interference between tests
  });

  // Helper to setup select mock with specific mocks and default fallback
  const setupSelectMock = (...specificMocks: any[]) => {
    (db.select as jest.Mock).mockReset();
    
    // Create a fresh counter for each setup
    const state = { mockIndex: 0 };
    
    // Helper to create default chainable mock
    const createDefaultChain = () => {
      const createWhereWithLimit = (result: any = []) => {
        const promise = Promise.resolve(result);
        (promise as any).limit = jest.fn(() => Promise.resolve(result));
        return promise;
      };
      return {
        where: jest.fn(() => createWhereWithLimit([])),
        limit: jest.fn(() => Promise.resolve([])),
        leftJoin: jest.fn(() => ({
          where: jest.fn(() => createWhereWithLimit([])),
        })),
        innerJoin: jest.fn(() => ({
          innerJoin: jest.fn(() => ({
            where: jest.fn(() => createWhereWithLimit([])),
          })),
          where: jest.fn(() => createWhereWithLimit([])),
        })),
      };
    };
    
    (db.select as jest.Mock).mockImplementation(() => {
      if (state.mockIndex < specificMocks.length) {
        return specificMocks[state.mockIndex++];
      }
      // Return fresh default chain for each call
      return {
        from: jest.fn(() => createDefaultChain()),
      };
    });
  };

  describe("create", () => {
    const createOrderDto = {
      shippingAddressId: mockShippingAddressId,
      billingAddressId: mockBillingAddressId,
      shippingCost: 50,
    };

    it.skip("should create order successfully from cart", async () => {
      // Mock getCustomerId
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      // Mock validateAddresses
      const mockShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      const mockBillingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockBillingAddress]),
          }),
        }),
      };

      // Mock getCart
      (cartsService.getCart as jest.Mock).mockResolvedValue(mockCart);

      // Mock cartItemsWithVariants query: select().from().innerJoin().innerJoin().where()
      const mockCartItemsAfterSecondJoin = {
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsAfterFirstJoin = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterSecondJoin),
      };
      const mockCartItemsFromResult = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterFirstJoin),
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsChain = {
        from: jest.fn().mockReturnValue(mockCartItemsFromResult),
      };

      // Mock variant-to-product mapping query (for pricing engine)
      const mockVariantProductChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            {
              variantId: mockVariantId,
              productId: mockProductId,
            },
          ]),
        }),
      };

      // Mock product details query (for pricing engine)
      const mockProductDetailsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            {
              productId: mockProductId,
              categoryId: null,
            },
          ]),
        }),
      };

      // Mock customer group query (for pricing engine)
      const mockCustomerGroupChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                id: mockCustomerId,
                customerGroupId: null,
              },
            ]),
          }),
        }),
      };

      // Mock generateOrderNumber: select().from().where().orderBy().limit()
      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      // Mock insert order
      const mockInsertOrderChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: mockOrderId,
            customerId: mockCustomerId,
            orderNumber: "ORD-2025-000001",
            status: "pending",
            subtotal: 1000,
            gstAmount: 180,
            discountCode: null,
            discountAmount: 0,
            shippingCost: 50,
            total: 1230,
            shippingAddressId: mockShippingAddressId,
            billingAddressId: mockBillingAddressId,
            razorpayOrderId: null,
            shippingProvider: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };

      // Mock insert order items
      const mockInsertOrderItemsChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: "order-item-123",
            orderId: mockOrderId,
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            gstRate: 18,
            gstAmount: 180,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };

      setupSelectMock(
        mockCustomerChain,
        mockShippingAddressChain,
        mockBillingAddressChain,
        mockCartItemsChain,
        mockVariantProductChain,
        mockProductDetailsChain,
        mockCustomerGroupChain,
        mockOrdersChain
      );

      (db.insert as jest.Mock)
        .mockReturnValueOnce(mockInsertOrderChain)
        .mockReturnValueOnce(mockInsertOrderItemsChain);

      // Mock checkout store - session created and lock acquired successfully
      (checkoutStore.createSession as jest.Mock).mockResolvedValue({
        sessionId: "checkout-session-123",
        session: {
          state: "CREATED",
          cartId: mockCartId,
          paymentIntentId: null,
          orderId: null,
          updatedAt: new Date().toISOString(),
        },
      });
      (checkoutStore.acquireCheckoutLock as jest.Mock).mockResolvedValue(true);
      (checkoutStore.transitionState as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.setOrder as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.releaseCheckoutLock as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Mock idempotency store
      (idempotencyStore.getIdempotencyResult as jest.Mock).mockResolvedValue(
        null,
      );
      (idempotencyStore.checkAndSet as jest.Mock).mockResolvedValue(true);
      (idempotencyStore.set as jest.Mock).mockResolvedValue(undefined);

      // Mock discount service (no discount code)
      (discountsService.validateDiscount as jest.Mock).mockResolvedValue({
        isValid: false,
      });

      // Mock inventory store
      (inventoryStore.releaseCartReservations as jest.Mock).mockResolvedValue(
        undefined,
      );
      (inventoryStore.incrementInventory as jest.Mock).mockResolvedValue(8);

      (cartsService.clearCart as jest.Mock).mockResolvedValue(mockCart);

      // Mock payments service
      const mockCheckoutSessionId = "checkout-session-123";
      (paymentsService.createPaymentIntent as jest.Mock).mockResolvedValue({
        paymentIntentId: "pi-456",
        paymentProvider: "razorpay",
        status: "CREATED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      (checkoutStore.assertState as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.assertStateIn as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.getSession as jest.Mock).mockResolvedValue({
        state: CheckoutState.PAYMENT_PENDING,
        cartId: mockCartId,
        paymentIntentId: "pi-456",
        orderId: null,
        updatedAt: new Date().toISOString(),
      });

      // Mock checkout metadata storage
      (checkoutStore.storeCheckoutMetadata as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await service.create(mockUserId, createOrderDto);

      expect(result).toBeDefined();
      expect(result.paymentIntent).toBeDefined();
      expect(result.paymentIntent.paymentIntentId).toBe("pi-456");
      expect(result.checkoutSessionId).toBe(mockCheckoutSessionId);
      expect(result.message).toContain("Payment intent created");
      // Verify payment intent was created
      expect(paymentsService.createPaymentIntent).toHaveBeenCalledWith(
        mockCheckoutSessionId,
        expect.any(Number), // Amount in paise
        "INR",
        undefined,
        expect.any(Object),
      );
      // Verify metadata was stored
      expect(checkoutStore.storeCheckoutMetadata).toHaveBeenCalledWith(
        mockCheckoutSessionId,
        expect.objectContaining({
          userId: mockUserId,
          shippingAddressId: mockShippingAddressId,
          billingAddressId: mockBillingAddressId,
          shippingCost: 50,
        }),
      );
      // Verify checkout lock was acquired and released
      expect(checkoutStore.acquireCheckoutLock).toHaveBeenCalledWith(
        mockCartId,
      );
      expect(checkoutStore.releaseCheckoutLock).toHaveBeenCalledWith(
        mockCartId,
      );
      // Verify NO order was created (orders are created in webhook handler)
      expect(db.insert).not.toHaveBeenCalled();
      // Verify NO inventory commit (happens in webhook handler)
      expect(inventoryStore.releaseCartReservations).not.toHaveBeenCalled();
      expect(cartsService.clearCart).not.toHaveBeenCalled();
    });

    it.skip("should return stored result for idempotent order replay", async () => {
      // NOTE: This test is outdated - request-level idempotency is no longer used.
      // Idempotency is now handled at payment intent level (createOrGetPaymentIntent).
      // This test should be updated to test payment intent idempotency instead.
      const createOrderDto = {
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        shippingCost: 50,
        idempotencyKey: "test-idempotency-key",
      };

      const storedOrderResult = {
        id: mockOrderId,
        orderNumber: "ORD-2025-000001",
        status: "pending",
        total: 1230,
        items: [],
      };

      // Mock idempotency store to return stored result
      (idempotencyStore.getIdempotencyResult as jest.Mock).mockResolvedValue(
        storedOrderResult,
      );

      const result = await service.create(mockUserId, createOrderDto);

      // Should return stored result without creating new order
      expect(result).toEqual(storedOrderResult);
      expect(idempotencyStore.getIdempotencyResult).toHaveBeenCalledWith(
        "order:create",
        "test-idempotency-key",
      );
      // Should not proceed with order creation
      expect(db.insert).not.toHaveBeenCalled();
    });

    it.skip("should delete idempotency key on order creation failure", async () => {
      const createOrderDto = {
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        shippingCost: 50,
      };

      // Mock idempotency store
      (idempotencyStore.getIdempotencyResult as jest.Mock).mockResolvedValue(
        null,
      );
      (idempotencyStore.checkAndSet as jest.Mock).mockResolvedValue(true);
      (idempotencyStore.deleteIdempotency as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Mock getCart for idempotency key generation (first call succeeds)
      (cartsService.getCart as jest.Mock)
        .mockResolvedValueOnce(mockCart) // For idempotency key generation
        .mockResolvedValueOnce(mockCart); // For actual order creation

      // Mock checkout store - session created
      (checkoutStore.createSession as jest.Mock).mockResolvedValue({
        sessionId: "checkout-session-123",
        session: {
          state: "CREATED",
          cartId: mockCartId,
          paymentIntentId: null,
          orderId: null,
          updatedAt: new Date().toISOString(),
        },
      });
      (checkoutStore.acquireCheckoutLock as jest.Mock).mockResolvedValue(true);
      (checkoutStore.failSession as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.releaseCheckoutLock as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Mock getCustomerId to throw error (this happens inside try block)
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]), // No customer found
          }),
        }),
      };
      (db.select as jest.Mock).mockReturnValue(mockCustomerChain);

      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow(NotFoundException);

      // Should delete idempotency key on failure
      expect(idempotencyStore.deleteIdempotency).toHaveBeenCalled();
    });

    it.skip("should throw NotFoundException if customer not found", async () => {
      // Mock getCustomerId: select().from().where().limit()
      const mockChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as jest.Mock).mockReturnValue(mockChain);

      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow(NotFoundException);
    });

    it.skip("should throw NotFoundException if shipping address not found", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockShippingAddressChain);

      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow(NotFoundException);
    });

    it.skip("should throw BadRequestException if cart is empty", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      const mockBillingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockBillingAddress]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockShippingAddressChain)
        .mockReturnValueOnce(mockBillingAddressChain);

      (cartsService.getCart as jest.Mock).mockResolvedValue({
        ...mockCart,
        items: [],
      });

      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow(BadRequestException);
    });

    it.skip("should create checkout session and transition states during order creation", async () => {
      // Similar setup to successful order creation test
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      const mockBillingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockBillingAddress]),
          }),
        }),
      };

      const mockCart = {
        id: mockCartId,
        customerId: mockCustomerId,
        items: [
          {
            id: "cart-item-1",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
          },
        ],
      };

      const mockCartChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockCart]),
          }),
        }),
      };

      const mockCartItemsAfterSecondJoin = {
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-1",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsAfterFirstJoin = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterSecondJoin),
      };
      const mockCartItemsFromResult = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterFirstJoin),
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsChain = {
        from: jest.fn().mockReturnValue(mockCartItemsFromResult),
      };

      const mockOrder = {
        id: mockOrderId,
        orderNumber: "ORD-2025-000001",
        status: "pending",
        total: 1230,
      };

      const mockInsertOrderChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockOrder]),
      };

      const mockInsertOrderItemsChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([]),
      };

      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockShippingAddressChain)
        .mockReturnValueOnce(mockBillingAddressChain)
        .mockReturnValueOnce(mockCartItemsChain)
        .mockReturnValueOnce(mockOrdersChain);

      (db.insert as jest.Mock)
        .mockReturnValueOnce(mockInsertOrderChain)
        .mockReturnValueOnce(mockInsertOrderItemsChain);

      (checkoutStore.createSession as jest.Mock).mockResolvedValue({
        sessionId: "checkout-session-123",
        session: {
          state: "CREATED",
          cartId: mockCartId,
          paymentIntentId: null,
          orderId: null,
          updatedAt: new Date().toISOString(),
        },
      });
      (checkoutStore.acquireCheckoutLock as jest.Mock).mockResolvedValue(true);
      (checkoutStore.transitionState as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.setOrder as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.releaseCheckoutLock as jest.Mock).mockResolvedValue(
        undefined,
      );

      (idempotencyStore.getIdempotencyResult as jest.Mock).mockResolvedValue(
        null,
      );
      (idempotencyStore.checkAndSet as jest.Mock).mockResolvedValue(true);
      (idempotencyStore.set as jest.Mock).mockResolvedValue(undefined);

      (discountsService.validateDiscount as jest.Mock).mockResolvedValue({
        isValid: false,
      });

      (inventoryStore.releaseCartReservations as jest.Mock).mockResolvedValue(
        undefined,
      );
      (inventoryStore.incrementInventory as jest.Mock).mockResolvedValue(8);

      (cartsService.getCart as jest.Mock).mockResolvedValue(mockCart);
      (cartsService.clearCart as jest.Mock).mockResolvedValue(mockCart);

      // Mock payments service
      (paymentsService.createPaymentIntent as jest.Mock).mockResolvedValue({
        paymentIntentId: "pi-456",
        paymentProvider: "razorpay",
        status: "CREATED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      (checkoutStore.assertStateIn as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.getSession as jest.Mock).mockResolvedValue({
        state: CheckoutState.PAYMENT_PENDING,
        cartId: mockCartId,
        paymentIntentId: "pi-456",
        orderId: null,
        updatedAt: new Date().toISOString(),
      });

      await service.create(mockUserId, createOrderDto);

      // Verify state machine integration
      expect(checkoutStore.createSession).toHaveBeenCalledWith(mockCartId);
      expect(checkoutStore.transitionState).toHaveBeenCalledWith(
        "checkout-session-123",
        "CREATED",
        "LOCKED",
      );
      expect(checkoutStore.setOrder).toHaveBeenCalledWith(
        "checkout-session-123",
        mockOrderId,
      );
      expect(checkoutStore.transitionState).toHaveBeenCalledWith(
        "checkout-session-123",
        "PAYMENT_PENDING",
        "ORDER_CREATED",
      );
      expect(checkoutStore.transitionState).toHaveBeenCalledWith(
        "checkout-session-123",
        "ORDER_CREATED",
        "COMPLETED",
      );
    });

    it.skip("should throw ConflictException when cart is already locked for checkout", async () => {
      // Mock getCustomerId
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      // Mock validateAddresses
      const mockShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      const mockBillingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockBillingAddress]),
          }),
        }),
      };

      // Mock getCart
      (cartsService.getCart as jest.Mock).mockResolvedValue(mockCart);

      // Mock checkout store - session created but lock acquisition fails (cart already locked)
      (checkoutStore.createSession as jest.Mock).mockResolvedValue({
        sessionId: "checkout-session-123",
        session: {
          state: "CREATED",
          cartId: mockCartId,
          paymentIntentId: null,
          orderId: null,
          updatedAt: new Date().toISOString(),
        },
      });
      (checkoutStore.acquireCheckoutLock as jest.Mock).mockResolvedValue(false);
      (checkoutStore.failSession as jest.Mock).mockResolvedValue(undefined);

      // Mock idempotency store
      (idempotencyStore.getIdempotencyResult as jest.Mock).mockResolvedValue(
        null,
      );
      (idempotencyStore.checkAndSet as jest.Mock).mockResolvedValue(true);

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockShippingAddressChain)
        .mockReturnValueOnce(mockBillingAddressChain);

      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow(ConflictException);

      // Verify session was created
      expect(checkoutStore.createSession).toHaveBeenCalledWith(mockCartId);
      // Verify lock was attempted
      expect(checkoutStore.acquireCheckoutLock).toHaveBeenCalledWith(
        mockCartId,
      );
      // Verify session was failed when lock acquisition failed
      expect(checkoutStore.failSession).toHaveBeenCalledWith(
        "checkout-session-123",
      );
      // Verify lock was not released (since it wasn't acquired)
      expect(checkoutStore.releaseCheckoutLock).not.toHaveBeenCalled();
    });

    it.skip("should release checkout lock on successful order creation", async () => {
      // Mock getCustomerId
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      // Mock validateAddresses
      const mockShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      const mockBillingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockBillingAddress]),
          }),
        }),
      };

      // Mock getCart
      (cartsService.getCart as jest.Mock).mockResolvedValue(mockCart);

      // Mock checkout store - session created, lock acquired and released
      (checkoutStore.createSession as jest.Mock).mockResolvedValue({
        sessionId: "checkout-session-123",
        session: {
          state: "CREATED",
          cartId: mockCartId,
          paymentIntentId: null,
          orderId: null,
          updatedAt: new Date().toISOString(),
        },
      });
      (checkoutStore.acquireCheckoutLock as jest.Mock).mockResolvedValue(true);
      (checkoutStore.transitionState as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.setOrder as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.releaseCheckoutLock as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Mock cartItemsWithVariants query: select().from().innerJoin().innerJoin().where()
      const mockCartItemsAfterSecondJoin = {
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsAfterFirstJoin = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterSecondJoin),
      };
      const mockCartItemsFromResult = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterFirstJoin),
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsChain = {
        from: jest.fn().mockReturnValue(mockCartItemsFromResult),
      };

      // Mock generateOrderNumber: select().from().where().orderBy().limit()
      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      // Mock insert order
      const mockInsertOrderChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: mockOrderId,
            customerId: mockCustomerId,
            orderNumber: "ORD-2025-000001",
            status: "pending",
            subtotal: 1000,
            gstAmount: 180,
            discountCode: null,
            discountAmount: 0,
            shippingCost: 50,
            total: 1230,
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
            razorpayOrderId: null,
            shippingProvider: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };

      // Mock insert order items
      const mockInsertOrderItemsChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: "order-item-123",
            orderId: mockOrderId,
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            gstRate: 18,
            gstAmount: 180,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockShippingAddressChain)
        .mockReturnValueOnce(mockBillingAddressChain)
        .mockReturnValueOnce(mockCartItemsChain)
        .mockReturnValueOnce(mockOrdersChain);

      (db.insert as jest.Mock)
        .mockReturnValueOnce(mockInsertOrderChain)
        .mockReturnValueOnce(mockInsertOrderItemsChain);

      // Mock idempotency store
      (idempotencyStore.getIdempotencyResult as jest.Mock).mockResolvedValue(
        null,
      );
      (idempotencyStore.checkAndSet as jest.Mock).mockResolvedValue(true);
      (idempotencyStore.set as jest.Mock).mockResolvedValue(undefined);

      // Mock discount service (no discount code)
      (discountsService.validateDiscount as jest.Mock).mockResolvedValue({
        isValid: false,
      });

      // Mock inventory store
      (inventoryStore.releaseCartReservations as jest.Mock).mockResolvedValue(
        undefined,
      );
      (inventoryStore.incrementInventory as jest.Mock).mockResolvedValue(8);

      (cartsService.clearCart as jest.Mock).mockResolvedValue(mockCart);

      // Mock payments service
      const mockCheckoutSessionId = "checkout-session-123";
      (paymentsService.createPaymentIntent as jest.Mock).mockResolvedValue({
        paymentIntentId: "pi-456",
        paymentProvider: "razorpay",
        status: "CREATED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      (checkoutStore.assertStateIn as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.getSession as jest.Mock).mockResolvedValue({
        state: CheckoutState.PAYMENT_PENDING,
        cartId: mockCartId,
        paymentIntentId: "pi-456",
        orderId: null,
        updatedAt: new Date().toISOString(),
      });

      const result = await service.create(mockUserId, createOrderDto);

      expect(result).toBeDefined();
      // Verify lock was acquired and released
      expect(checkoutStore.acquireCheckoutLock).toHaveBeenCalledWith(
        mockCartId,
      );
      expect(checkoutStore.releaseCheckoutLock).toHaveBeenCalledWith(
        mockCartId,
      );
    });

    it.skip("should fail checkout session and release lock on error during order creation", async () => {
      // Mock getCustomerId
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      // Mock validateAddresses
      const mockShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      const mockBillingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockBillingAddress]),
          }),
        }),
      };

      // Mock getCart
      (cartsService.getCart as jest.Mock).mockResolvedValue(mockCart);

      // Mock checkout store - session created, lock acquired, will be failed and released on error
      (checkoutStore.createSession as jest.Mock).mockResolvedValue({
        sessionId: "checkout-session-123",
        session: {
          state: "CREATED",
          cartId: mockCartId,
          paymentIntentId: null,
          orderId: null,
          updatedAt: new Date().toISOString(),
        },
      });
      (checkoutStore.acquireCheckoutLock as jest.Mock).mockResolvedValue(true);
      (checkoutStore.transitionState as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.failSession as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.releaseCheckoutLock as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Mock idempotency store
      (idempotencyStore.getIdempotencyResult as jest.Mock).mockResolvedValue(
        null,
      );
      (idempotencyStore.checkAndSet as jest.Mock).mockResolvedValue(true);
      (idempotencyStore.deleteIdempotency as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Mock cartItemsWithVariants query to throw error
      // Create error lazily inside mockImplementation to avoid evaluation during module initialization
      const mockCartItemsAfterSecondJoin = {
        where: jest.fn().mockImplementation(() => {
          const err = new Error("Database error");
          return Promise.reject(err);
        }),
      };
      const mockCartItemsAfterFirstJoin = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterSecondJoin),
      };
      const mockCartItemsFromResult = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterFirstJoin),
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsChain = {
        from: jest.fn().mockReturnValue(mockCartItemsFromResult),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockShippingAddressChain)
        .mockReturnValueOnce(mockBillingAddressChain)
        .mockReturnValueOnce(mockCartItemsChain);

      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow("Database error");

      // Note: Mock cleanup is handled by afterEach hook

      // Verify session was created
      expect(checkoutStore.createSession).toHaveBeenCalledWith(mockCartId);
      // Verify lock was acquired
      expect(checkoutStore.acquireCheckoutLock).toHaveBeenCalledWith(
        mockCartId,
      );
      // Verify session was failed on error
      expect(checkoutStore.failSession).toHaveBeenCalledWith(
        "checkout-session-123",
      );
      // Verify lock was released on error
      expect(checkoutStore.releaseCheckoutLock).toHaveBeenCalledWith(
        mockCartId,
      );
    });

    it.skip("should create order with default shipping cost when not provided", async () => {
      const createOrderDtoWithoutShippingCost = {
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      const mockBillingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockBillingAddress]),
          }),
        }),
      };

      (cartsService.getCart as jest.Mock).mockResolvedValue(mockCart);

      // Mock checkout store - session created, lock acquired successfully
      (checkoutStore.createSession as jest.Mock).mockResolvedValue({
        sessionId: "checkout-session-123",
        session: {
          state: "CREATED",
          cartId: mockCartId,
          paymentIntentId: null,
          orderId: null,
          updatedAt: new Date().toISOString(),
        },
      });
      (checkoutStore.acquireCheckoutLock as jest.Mock).mockResolvedValue(true);
      (checkoutStore.transitionState as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.setOrder as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.releaseCheckoutLock as jest.Mock).mockResolvedValue(
        undefined,
      );

      const mockCartItemsAfterSecondJoin = {
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsAfterFirstJoin = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterSecondJoin),
      };
      const mockCartItemsFromResult = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterFirstJoin),
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsChain = {
        from: jest.fn().mockReturnValue(mockCartItemsFromResult),
      };

      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      const mockInsertOrderChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: mockOrderId,
            customerId: mockCustomerId,
            orderNumber: "ORD-2025-000001",
            status: "pending",
            subtotal: 1000,
            gstAmount: 180,
            shippingCost: 0,
            total: 1180,
            shippingAddressId: mockShippingAddressId,
            billingAddressId: mockBillingAddressId,
            razorpayOrderId: null,
            shippingProvider: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };

      const mockInsertOrderItemsChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: "order-item-123",
            orderId: mockOrderId,
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            gstRate: 18,
            gstAmount: 180,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockShippingAddressChain)
        .mockReturnValueOnce(mockBillingAddressChain)
        .mockReturnValueOnce(mockCartItemsChain)
        .mockReturnValueOnce(mockOrdersChain);
      (db.insert as jest.Mock)
        .mockReturnValueOnce(mockInsertOrderChain)
        .mockReturnValueOnce(mockInsertOrderItemsChain);

      // Mock checkout store - session created and lock acquired successfully
      (checkoutStore.createSession as jest.Mock).mockResolvedValue({
        sessionId: "checkout-session-123",
        session: {
          state: "CREATED",
          cartId: mockCartId,
          paymentIntentId: null,
          orderId: null,
          updatedAt: new Date().toISOString(),
        },
      });
      (checkoutStore.acquireCheckoutLock as jest.Mock).mockResolvedValue(true);
      (checkoutStore.transitionState as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.setOrder as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.releaseCheckoutLock as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Mock idempotency store
      (idempotencyStore.getIdempotencyResult as jest.Mock).mockResolvedValue(
        null,
      );
      (idempotencyStore.checkAndSet as jest.Mock).mockResolvedValue(true);
      (idempotencyStore.set as jest.Mock).mockResolvedValue(undefined);

      // Mock inventory store - new implementation uses releaseCartReservations and incrementInventory
      (inventoryStore.releaseCartReservations as jest.Mock).mockResolvedValue(
        undefined,
      );
      (inventoryStore.incrementInventory as jest.Mock).mockResolvedValue(8);

      (cartsService.clearCart as jest.Mock).mockResolvedValue(undefined);

      // Mock payments service
      const mockCheckoutSessionId = "checkout-session-123";
      (paymentsService.createPaymentIntent as jest.Mock).mockResolvedValue({
        paymentIntentId: "pi-456",
        paymentProvider: "razorpay",
        status: "CREATED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      (checkoutStore.assertStateIn as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.getSession as jest.Mock).mockResolvedValue({
        state: CheckoutState.PAYMENT_PENDING,
        cartId: mockCartId,
        paymentIntentId: "pi-456",
        orderId: null,
        updatedAt: new Date().toISOString(),
      });

      // Mock checkout metadata storage
      (checkoutStore.storeCheckoutMetadata as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await service.create(
        mockUserId,
        createOrderDtoWithoutShippingCost,
      );

      expect(result).toBeDefined();
      expect(result.paymentIntent).toBeDefined();
      expect(result.paymentIntent.paymentIntentId).toBe("pi-456");
      expect(result.checkoutSessionId).toBe(mockCheckoutSessionId);
      expect(result.message).toContain("Payment intent created");
      // Verify metadata was stored with default shipping cost (0)
      expect(checkoutStore.storeCheckoutMetadata).toHaveBeenCalledWith(
        mockCheckoutSessionId,
        expect.objectContaining({
          userId: mockUserId,
          shippingAddressId: mockShippingAddressId,
          billingAddressId: mockBillingAddressId,
          shippingCost: 0, // Default shipping cost when not provided
        }),
      );
      // Verify NO inventory operations (happen in webhook handler)
      expect(inventoryStore.releaseCartReservations).not.toHaveBeenCalled();
      expect(inventoryStore.incrementInventory).not.toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it.skip("should return order with items", async () => {
      const mockOrder = {
        id: mockOrderId,
        customerId: mockCustomerId,
        orderNumber: "ORD-2025-000001",
        status: "pending" as const,
        subtotal: 1000,
        gstAmount: 180,
        shippingCost: 50,
        total: 1230,
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        razorpayOrderId: null,
        shippingProvider: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOrderItems = [
        {
          id: "order-item-123",
          orderId: mockOrderId,
          productVariantId: mockVariantId,
          quantity: 2,
          price: 500,
          gstRate: 18,
          gstAmount: 180,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockOrderItemsChain = {
        from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      };

      // Mock shipping address query for GST calculation
      const mockShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockOrderItemsChain)
        .mockReturnValueOnce(mockShippingAddressChain);

      const result = await service.findOne(mockUserId, mockOrderId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockOrderId);
      expect(result.items).toHaveLength(1);
    });

    it.skip("should throw NotFoundException if order not found", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain);

      await expect(
        service.findOne(mockUserId, mockOrderId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("generateOrderNumber", () => {
    it.skip("should generate order number with sequence when orders exist", async () => {
      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([
          { orderNumber: "ORD-2025-000005" },
        ]),
            }),
          }),
        }),
      };

      (db.select as jest.Mock).mockReturnValue(mockOrdersChain);

      // Access private method via reflection
      const generateOrderNumber = (service as any).generateOrderNumber.bind(
        service,
      );
      const result = await generateOrderNumber();

      expect(result).toBe("ORD-2025-000006");
    });

    it.skip("should handle invalid order number format gracefully (NaN case)", async () => {
      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([
          { orderNumber: "ORD-2025-INVALID" },
        ]),
            }),
          }),
        }),
      };

      (db.select as jest.Mock).mockReturnValue(mockOrdersChain);

      // Access private method via reflection
      const generateOrderNumber = (service as any).generateOrderNumber.bind(
        service,
      );
      const result = await generateOrderNumber();

      // Should default to sequence 1 when parsing fails
      expect(result).toMatch(/^ORD-\d{4}-000001$/);
    });

    it.skip("should handle invalid order number format gracefully", async () => {
      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([
          { orderNumber: "ORD-2025-INVALID" },
        ]),
            }),
          }),
        }),
      };

      (db.select as jest.Mock).mockReturnValue(mockOrdersChain);

      const generateOrderNumber = (service as any).generateOrderNumber.bind(
        service,
      );
      const result = await generateOrderNumber();

      expect(result).toMatch(/^ORD-\d{4}-000001$/);
    });
  });

  describe("validateAddresses", () => {
    it.skip("should throw NotFoundException if billing address not found", async () => {
      const mockShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      const mockBillingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockShippingAddressChain)
        .mockReturnValueOnce(mockBillingAddressChain);

      const validateAddresses = (service as any).validateAddresses.bind(
        service,
      );

      await expect(
        validateAddresses(
          mockCustomerId,
          mockShippingAddressId,
          mockBillingAddressId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    const createOrderDto = {
      shippingAddressId: mockShippingAddressId,
      billingAddressId: mockBillingAddressId,
      shippingCost: 50,
    };

    it.skip("should throw BadRequestException if cart is null", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      const mockBillingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockBillingAddress]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain) // getCustomerId
        .mockReturnValueOnce(mockShippingAddressChain) // validateAddresses - shipping
        .mockReturnValueOnce(mockBillingAddressChain); // validateAddresses - billing

      (cartsService.getCart as jest.Mock).mockResolvedValue(null);

      // Mock checkout store - createSession will be called even if cart is null
      (checkoutStore.createSession as jest.Mock).mockResolvedValue({
        sessionId: "checkout-session-123",
        session: {
          state: "CREATED",
          cartId: "cart-123",
          paymentIntentId: null,
          orderId: null,
          updatedAt: new Date().toISOString(),
        },
      });
      (checkoutStore.failSession as jest.Mock).mockResolvedValue(undefined);

      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow(BadRequestException);
    });

    it.skip("should throw BadRequestException if cart items is null", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      const mockBillingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockBillingAddress]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockShippingAddressChain)
        .mockReturnValueOnce(mockBillingAddressChain);

      (cartsService.getCart as jest.Mock).mockResolvedValue({
        ...mockCart,
        items: null,
      });

      // Mock checkout store - createSession will be called
      (checkoutStore.createSession as jest.Mock).mockResolvedValue({
        sessionId: "checkout-session-123",
        session: {
          state: "CREATED",
          cartId: mockCartId,
          paymentIntentId: null,
          orderId: null,
          updatedAt: new Date().toISOString(),
        },
      });
      (checkoutStore.failSession as jest.Mock).mockResolvedValue(undefined);

      await expect(
        service.create(mockUserId, createOrderDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAll", () => {
    it.skip("should return all orders for customer", async () => {
      const mockOrders = [
        {
          id: mockOrderId,
          customerId: mockCustomerId,
          orderNumber: "ORD-2025-000001",
          status: "pending" as const,
          subtotal: 1000,
          gstAmount: 180,
          shippingCost: 50,
          total: 1230,
          shippingAddressId: mockShippingAddressId,
          billingAddressId: mockBillingAddressId,
          razorpayOrderId: null,
          shippingProvider: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockOrderItems = [
        {
          id: "order-item-123",
          orderId: mockOrderId,
          productVariantId: mockVariantId,
          quantity: 2,
          price: 500,
          gstRate: 18,
          gstAmount: 180,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrder = {
        id: mockOrderId,
        customerId: mockCustomerId,
        orderNumber: "ORD-2025-000001",
        status: "pending" as const,
        subtotal: 1000,
        gstAmount: 180,
        shippingCost: 50,
        total: 1230,
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        razorpayOrderId: null,
        shippingProvider: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockOrderItemsChainForMap = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      };

      // Mock order items query for GST calculation (in calculateOrderGstBreakdown)
      const mockOrderItemsChainForGst = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      };

      // Mock shipping address query for GST calculation
      const mockShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrdersChain)
        .mockReturnValueOnce(mockOrderItemsChainForMap)
        .mockReturnValueOnce(mockOrderItemsChainForGst)
        .mockReturnValueOnce(mockShippingAddressChain);

      const result = await service.findAll(mockUserId);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].items).toHaveLength(1);
    });

    it.skip("should return empty array when customer has no orders", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrdersChain);

      const result = await service.findAll(mockUserId);

      expect(result).toBeDefined();
      expect(result).toHaveLength(0);
    });

    it.skip("should handle multiple orders with items", async () => {
      const mockOrders = [
        {
          id: mockOrderId,
          customerId: mockCustomerId,
          orderNumber: "ORD-2025-000001",
          status: "pending" as const,
          subtotal: 1000,
          gstAmount: 180,
          shippingCost: 50,
          total: 1230,
          shippingAddressId: mockShippingAddressId,
          billingAddressId: mockBillingAddressId,
          razorpayOrderId: null,
          shippingProvider: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "order-456",
          customerId: mockCustomerId,
          orderNumber: "ORD-2025-000002",
          status: "confirmed" as const,
          subtotal: 2000,
          gstAmount: 360,
          shippingCost: 100,
          total: 2460,
          shippingAddressId: mockShippingAddressId,
          billingAddressId: mockBillingAddressId,
          razorpayOrderId: null,
          shippingProvider: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockOrderItems1 = [
        {
          id: "order-item-123",
          orderId: mockOrderId,
          productVariantId: mockVariantId,
          quantity: 2,
          price: 500,
          gstRate: 18,
          gstAmount: 180,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockOrderItems2 = [
        {
          id: "order-item-456",
          orderId: "order-456",
          productVariantId: mockVariantId,
          quantity: 4,
          price: 500,
          gstRate: 18,
          gstAmount: 360,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockOrders),
          }),
        }),
      };

      const mockOrderItemsChain1 = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems1),
        }),
      };

      const mockOrderItemsChain2 = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems2),
        }),
      };

      // Mock order items queries for GST calculation
      const mockOrderItemsChainForGst1 = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems1),
        }),
      };

      const mockOrderItemsChainForGst2 = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems2),
        }),
      };

      // Mock shipping address queries for GST calculation
      const mockShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      // Mock discounts service to prevent discount calculation
      (discountsService.validateDiscount as jest.Mock).mockResolvedValue({
        isValid: false,
      });

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrdersChain)
        .mockReturnValueOnce(mockOrderItemsChain1)
        .mockReturnValueOnce(mockOrderItemsChain2)
        .mockReturnValueOnce(mockOrderItemsChainForGst1)
        .mockReturnValueOnce(mockShippingAddressChain)
        .mockReturnValueOnce(mockOrderItemsChainForGst2)
        .mockReturnValueOnce(mockShippingAddressChain);

      const result = await service.findAll(mockUserId);

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].items).toHaveLength(1);
      expect(result[1].items).toHaveLength(1);
    });

    it.skip("should return all orders when status filter is not provided", async () => {
      const mockOrders = [
        {
          id: "order-123",
          customerId: mockCustomerId,
          orderNumber: "ORD-2025-001234",
          status: "pending" as const,
          subtotal: 1000,
          gstAmount: 180,
          shippingCost: 50,
          total: 1230,
          shippingAddressId: mockShippingAddressId,
          billingAddressId: mockBillingAddressId,
          razorpayOrderId: null,
          shippingProvider: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockOrderItems = [
        {
          id: "order-item-123",
          orderId: "order-123",
          productVariantId: mockVariantId,
          quantity: 2,
          price: 500,
          gstRate: 18,
          gstAmount: 180,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockOrders),
          }),
        }),
      };

      const mockOrderItemsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      };

      // Mock order items for GST calculation
      const mockOrderItemsChainForGst = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      };

      // Mock shipping address for GST calculation
      const mockShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      // Mock discounts service
      (discountsService.validateDiscount as jest.Mock).mockResolvedValue({
        isValid: false,
      });

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrdersChain)
        .mockReturnValueOnce(mockOrderItemsChain)
        .mockReturnValueOnce(mockOrderItemsChainForGst)
        .mockReturnValueOnce(mockShippingAddressChain);

      const result = await service.findAll(mockUserId);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
    });

    it.skip("should filter orders by status", async () => {
      const mockOrders = [
        {
          id: "order-123",
          customerId: mockCustomerId,
          orderNumber: "ORD-2025-001234",
          status: "pending" as const,
          subtotal: 1000,
          gstAmount: 180,
          shippingCost: 50,
          total: 1230,
          shippingAddressId: mockShippingAddressId,
          billingAddressId: mockBillingAddressId,
          razorpayOrderId: null,
          shippingProvider: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockOrderItems = [
        {
          id: "order-item-123",
          orderId: "order-123",
          productVariantId: mockVariantId,
          quantity: 2,
          price: 500,
          gstRate: 18,
          gstAmount: 180,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockOrders),
          }),
        }),
      };

      const mockOrderItemsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      };

      // Mock order items for GST calculation
      const mockOrderItemsChainForGst = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      };

      // Mock shipping address for GST calculation
      const mockShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      // Mock discounts service
      (discountsService.validateDiscount as jest.Mock).mockResolvedValue({
        isValid: false,
      });

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrdersChain)
        .mockReturnValueOnce(mockOrderItemsChain)
        .mockReturnValueOnce(mockOrderItemsChainForGst)
        .mockReturnValueOnce(mockShippingAddressChain);

      const result = await service.findAll(mockUserId, OrderStatus.PENDING);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("pending");
    });
  });

  describe("updateStatus", () => {
    const mockOrder = {
      id: mockOrderId,
      customerId: mockCustomerId,
      orderNumber: "ORD-2025-001234",
      status: "pending" as const,
      subtotal: 1000,
      gstAmount: 180,
      shippingCost: 50,
      total: 1230,
      shippingAddressId: mockShippingAddressId,
      billingAddressId: mockBillingAddressId,
      razorpayOrderId: null,
      shippingProvider: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockUpdatedOrder = {
      ...mockOrder,
      status: "confirmed" as const,
      updatedAt: new Date(),
    };

    const mockOrderItems = [
      {
        id: "order-item-123",
        orderId: mockOrderId,
        productVariantId: mockVariantId,
        quantity: 2,
        price: 500,
        gstRate: 18,
        gstAmount: 180,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it.skip("should update order status successfully", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockUpdatedOrder]),
      };

      const mockOrderItemsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockOrderItemsChain);
      (db.update as jest.Mock).mockReturnValue(mockUpdateChain);

      const result = await service.updateStatus(mockUserId, mockOrderId, {
        status: OrderStatus.CONFIRMED,
      });

      expect(result).toBeDefined();
      expect(result.status).toBe("confirmed");
      expect(result.items).toHaveLength(1);
      expect(db.update).toHaveBeenCalled();
    });

    it.skip("should throw NotFoundException if order not found", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain);

      await expect(
        service.updateStatus(mockUserId, "non-existent-order", {
          status: OrderStatus.CONFIRMED,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it.skip("should throw BadRequestException for invalid status transition from pending", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain);

      await expect(
        service.updateStatus(mockUserId, mockOrderId, {
          status: OrderStatus.DELIVERED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it.skip("should throw BadRequestException for invalid status transition from confirmed", async () => {
      const confirmedOrder = { ...mockOrder, status: "confirmed" as const };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([confirmedOrder]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain);

      await expect(
        service.updateStatus(mockUserId, mockOrderId, {
          status: OrderStatus.DELIVERED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it.skip("should throw BadRequestException when trying to transition from cancelled", async () => {
      const cancelledOrder = { ...mockOrder, status: "cancelled" as const };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([cancelledOrder]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain);

      await expect(
        service.updateStatus(mockUserId, mockOrderId, {
          status: OrderStatus.CONFIRMED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it.skip("should allow valid transition from pending to confirmed", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockUpdatedOrder]),
      };

      const mockOrderItemsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockOrderItemsChain);
      (db.update as jest.Mock).mockReturnValue(mockUpdateChain);

      const result = await service.updateStatus(mockUserId, mockOrderId, {
        status: OrderStatus.CONFIRMED,
      });

      expect(result.status).toBe("confirmed");
    });

    it.skip("should allow valid transition from confirmed to processing", async () => {
      const confirmedOrder = { ...mockOrder, status: "confirmed" as const };
      const processingOrder = {
        ...confirmedOrder,
        status: "processing" as const,
        updatedAt: new Date(),
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([confirmedOrder]),
          }),
        }),
      };

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([processingOrder]),
      };

      const mockOrderItemsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockOrderItemsChain);
      (db.update as jest.Mock).mockReturnValue(mockUpdateChain);

      const result = await service.updateStatus(mockUserId, mockOrderId, {
        status: OrderStatus.PROCESSING,
      });

      expect(result.status).toBe("processing");
    });

    it.skip("should allow valid transition from processing to shipped", async () => {
      const processingOrder = { ...mockOrder, status: "processing" as const };
      const shippedOrder = {
        ...processingOrder,
        status: "shipped" as const,
        updatedAt: new Date(),
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([processingOrder]),
          }),
        }),
      };

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([shippedOrder]),
      };

      const mockOrderItemsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockOrderItemsChain);
      (db.update as jest.Mock).mockReturnValue(mockUpdateChain);

      const result = await service.updateStatus(mockUserId, mockOrderId, {
        status: OrderStatus.SHIPPED,
      });

      expect(result.status).toBe("shipped");
    });

    it.skip("should allow valid transition from shipped to delivered", async () => {
      const shippedOrder = { ...mockOrder, status: "shipped" as const };
      const deliveredOrder = {
        ...shippedOrder,
        status: "delivered" as const,
        updatedAt: new Date(),
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([shippedOrder]),
          }),
        }),
      };

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([deliveredOrder]),
      };

      const mockOrderItemsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockOrderItemsChain);
      (db.update as jest.Mock).mockReturnValue(mockUpdateChain);

      const result = await service.updateStatus(mockUserId, mockOrderId, {
        status: OrderStatus.DELIVERED,
      });

      expect(result.status).toBe("delivered");
    });

    it.skip("should allow valid transition from delivered to refunded", async () => {
      const deliveredOrder = { ...mockOrder, status: "delivered" as const };
      const refundedOrder = {
        ...deliveredOrder,
        status: "refunded" as const,
        updatedAt: new Date(),
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([deliveredOrder]),
          }),
        }),
      };

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([refundedOrder]),
      };

      const mockOrderItemsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockOrderItemsChain);
      (db.update as jest.Mock).mockReturnValue(mockUpdateChain);

      const result = await service.updateStatus(mockUserId, mockOrderId, {
        status: OrderStatus.REFUNDED,
      });

      expect(result.status).toBe("refunded");
    });

    it.skip("should allow valid transition from pending to cancelled", async () => {
      const cancelledOrder = {
        ...mockOrder,
        status: "cancelled" as const,
        updatedAt: new Date(),
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([cancelledOrder]),
      };

      const mockOrderItemsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockOrderItemsChain);
      (db.update as jest.Mock).mockReturnValue(mockUpdateChain);

      const result = await service.updateStatus(mockUserId, mockOrderId, {
        status: OrderStatus.CANCELLED,
      });

      expect(result.status).toBe("cancelled");
    });

    it.skip("should throw BadRequestException for unknown status", async () => {
      const unknownStatusOrder = {
        ...mockOrder,
        status: "unknown_status" as any,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([unknownStatusOrder]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain);

      await expect(
        service.updateStatus(mockUserId, mockOrderId, {
          status: OrderStatus.CONFIRMED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it.skip("should throw BadRequestException when trying to transition from refunded", async () => {
      const refundedOrder = { ...mockOrder, status: "refunded" as const };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([refundedOrder]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain);

      await expect(
        service.updateStatus(mockUserId, mockOrderId, {
          status: OrderStatus.CONFIRMED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it.skip("should show 'none' when no valid transitions exist", async () => {
      const cancelledOrder = { ...mockOrder, status: "cancelled" as const };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([cancelledOrder]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain);

      try {
        await service.updateStatus(mockUserId, mockOrderId, {
          status: OrderStatus.CONFIRMED,
        });
        fail("Should have thrown BadRequestException");
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain("none");
      }
    });
  });

  describe("getTracking", () => {
    const mockOrder = {
      id: mockOrderId,
      customerId: mockCustomerId,
      orderNumber: "ORD-2025-001234",
      status: "shipped" as const,
      subtotal: 1000,
      gstAmount: 180,
      shippingCost: 50,
      total: 1230,
      shippingAddressId: mockShippingAddressId,
      billingAddressId: mockBillingAddressId,
      razorpayOrderId: null,
      shippingProvider: "shiprocket",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockShipment = {
      id: "shipment-123",
      orderId: mockOrderId,
      provider: "shiprocket",
      trackingNumber: "TRACK123456789",
      status: "in_transit" as const,
      labelUrl: "https://example.com/label.pdf",
      awbNumber: "AWB123456789",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it.skip("should return order tracking information with shipments", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockShipment]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTracking(mockUserId, mockOrderId);

      expect(result).toBeDefined();
      expect(result.orderId).toBe(mockOrderId);
      expect(result.orderNumber).toBe("ORD-2025-001234");
      expect(result.status).toBe("shipped");
      expect(result.shippingProvider).toBe("shiprocket");
      expect(result.shipments).toHaveLength(1);
      expect(result.shipments[0].trackingNumber).toBe("TRACK123456789");
      expect(result.shipments[0].status).toBe("in_transit");
    });

    it.skip("should return empty shipments array when no shipments exist", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTracking(mockUserId, mockOrderId);

      expect(result).toBeDefined();
      expect(result.shipments).toHaveLength(0);
    });

    it.skip("should throw NotFoundException if order not found", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain);

      await expect(
        service.getTracking(mockUserId, "non-existent-order"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getTimeline", () => {
    const mockOrder = {
      id: mockOrderId,
      customerId: mockCustomerId,
      orderNumber: "ORD-2025-001234",
      status: "shipped" as const,
      subtotal: 1000,
      gstAmount: 180,
      shippingCost: 50,
      total: 1230,
      shippingAddressId: mockShippingAddressId,
      billingAddressId: mockBillingAddressId,
      razorpayOrderId: null,
      shippingProvider: "shiprocket",
      createdAt: new Date("2025-11-26T10:00:00Z"),
      updatedAt: new Date("2025-11-26T12:00:00Z"),
    };

    const mockPayment = {
      id: "payment-123",
      orderId: mockOrderId,
      razorpayPaymentId: "pay_123456",
      razorpayOrderId: "order_123456",
      amount: 1230,
      status: "captured" as const,
      method: "razorpay" as const,
      createdAt: new Date("2025-11-26T10:30:00Z"),
      updatedAt: new Date("2025-11-26T10:31:00Z"),
    };

    const mockShipment = {
      id: "shipment-123",
      orderId: mockOrderId,
      provider: "shiprocket",
      trackingNumber: "TRACK123456789",
      status: "in_transit" as const,
      labelUrl: "https://example.com/label.pdf",
      awbNumber: "AWB123456789",
      createdAt: new Date("2025-11-26T11:00:00Z"),
      updatedAt: new Date("2025-11-26T12:00:00Z"),
    };

    it.skip("should return order timeline with all events", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockPayment]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockShipment]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      expect(result).toBeDefined();
      expect(result.orderId).toBe(mockOrderId);
      expect(result.orderNumber).toBe("ORD-2025-001234");
      expect(result.currentStatus).toBe("shipped");
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events[0].type).toBeDefined();
      expect(result.events[0].title).toBeDefined();
      expect(result.events[0].timestamp).toBeDefined();
    });

    it.skip("should include order created event", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const orderCreatedEvent = result.events.find(
        (e) => e.type === "order_created",
      );
      expect(orderCreatedEvent).toBeDefined();
      expect(orderCreatedEvent?.title).toBe("Order Created");
    });

    it.skip("should include payment events when payments exist", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockPayment]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const paymentInitiatedEvent = result.events.find(
        (e) => e.type === "payment_initiated",
      );
      expect(paymentInitiatedEvent).toBeDefined();

      const paymentCompletedEvent = result.events.find(
        (e) => e.type === "payment_completed",
      );
      expect(paymentCompletedEvent).toBeDefined();
    });

    it.skip("should include shipment events when shipments exist", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockShipment]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const shipmentCreatedEvent = result.events.find(
        (e) => e.type === "shipment_created",
      );
      expect(shipmentCreatedEvent).toBeDefined();

      const shipmentInTransitEvent = result.events.find(
        (e) => e.type === "shipment_in_transit",
      );
      expect(shipmentInTransitEvent).toBeDefined();
    });

    it.skip("should handle failed payment status", async () => {
      const failedPayment = {
        ...mockPayment,
        status: "failed" as const,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([failedPayment]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const paymentFailedEvent = result.events.find(
        (e) => e.type === "payment_failed",
      );
      expect(paymentFailedEvent).toBeDefined();
    });

    it.skip("should handle label_generated shipment status", async () => {
      const labelGeneratedShipment = {
        ...mockShipment,
        status: "label_generated" as const,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([labelGeneratedShipment]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const labelGeneratedEvent = result.events.find(
        (e) => e.type === "shipment_label_generated",
      );
      expect(labelGeneratedEvent).toBeDefined();
    });

    it.skip("should handle picked_up shipment status", async () => {
      const pickedUpShipment = {
        ...mockShipment,
        status: "picked_up" as const,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([pickedUpShipment]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const pickedUpEvent = result.events.find(
        (e) => e.type === "shipment_picked_up",
      );
      expect(pickedUpEvent).toBeDefined();
    });

    it.skip("should handle out_for_delivery shipment status", async () => {
      const outForDeliveryShipment = {
        ...mockShipment,
        status: "out_for_delivery" as const,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([outForDeliveryShipment]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const outForDeliveryEvent = result.events.find(
        (e) => e.type === "shipment_out_for_delivery",
      );
      expect(outForDeliveryEvent).toBeDefined();
    });

    it.skip("should handle different shipment statuses", async () => {
      const deliveredShipment = {
        ...mockShipment,
        status: "delivered" as const,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([deliveredShipment]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const shipmentDeliveredEvent = result.events.find(
        (e) => e.type === "shipment_delivered",
      );
      expect(shipmentDeliveredEvent).toBeDefined();
    });

    it.skip("should handle failed shipment status", async () => {
      const failedShipment = {
        ...mockShipment,
        status: "failed" as const,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([failedShipment]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const failedEvent = result.events.find(
        (e) => e.type === "shipment_failed",
      );
      expect(failedEvent).toBeDefined();
    });

    it.skip("should handle returned shipment status", async () => {
      const returnedShipment = {
        ...mockShipment,
        status: "returned" as const,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([returnedShipment]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const returnedEvent = result.events.find(
        (e) => e.type === "shipment_returned",
      );
      expect(returnedEvent).toBeDefined();
    });

    it.skip("should handle shipments without tracking numbers (label_generated)", async () => {
      const shipmentWithoutTracking = {
        ...mockShipment,
        trackingNumber: null,
        status: "label_generated" as const,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([shipmentWithoutTracking]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const labelGeneratedEvent = result.events.find(
        (e) => e.type === "shipment_label_generated",
      );
      expect(labelGeneratedEvent).toBeDefined();
      expect(labelGeneratedEvent?.description).not.toContain("tracking number");
    });

    it.skip("should handle shipments without tracking numbers (picked_up)", async () => {
      const shipmentWithoutTracking = {
        ...mockShipment,
        trackingNumber: null,
        status: "picked_up" as const,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([shipmentWithoutTracking]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const pickedUpEvent = result.events.find(
        (e) => e.type === "shipment_picked_up",
      );
      expect(pickedUpEvent).toBeDefined();
      expect(pickedUpEvent?.description).not.toContain("Tracking:");
    });

    it.skip("should handle shipments without tracking numbers (in_transit)", async () => {
      const shipmentWithoutTracking = {
        ...mockShipment,
        trackingNumber: null,
        status: "in_transit" as const,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([shipmentWithoutTracking]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const inTransitEvent = result.events.find(
        (e) => e.type === "shipment_in_transit",
      );
      expect(inTransitEvent).toBeDefined();
      expect(inTransitEvent?.description).not.toContain("Tracking:");
    });

    it.skip("should handle shipments without tracking numbers (out_for_delivery)", async () => {
      const shipmentWithoutTracking = {
        ...mockShipment,
        trackingNumber: null,
        status: "out_for_delivery" as const,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([shipmentWithoutTracking]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const outForDeliveryEvent = result.events.find(
        (e) => e.type === "shipment_out_for_delivery",
      );
      expect(outForDeliveryEvent).toBeDefined();
      expect(outForDeliveryEvent?.description).not.toContain("Tracking:");
    });

    it.skip("should handle shipments without tracking numbers (delivered)", async () => {
      const shipmentWithoutTracking = {
        ...mockShipment,
        trackingNumber: null,
        status: "delivered" as const,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([shipmentWithoutTracking]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const deliveredEvent = result.events.find(
        (e) => e.type === "shipment_delivered",
      );
      expect(deliveredEvent).toBeDefined();
      expect(deliveredEvent?.description).not.toContain("Tracking:");
    });

    it.skip("should handle shipments without tracking numbers (failed)", async () => {
      const shipmentWithoutTracking = {
        ...mockShipment,
        trackingNumber: null,
        status: "failed" as const,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([shipmentWithoutTracking]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const failedEvent = result.events.find(
        (e) => e.type === "shipment_failed",
      );
      expect(failedEvent).toBeDefined();
      expect(failedEvent?.description).not.toContain("Tracking:");
    });

    it.skip("should handle shipments without tracking numbers (returned)", async () => {
      const shipmentWithoutTracking = {
        ...mockShipment,
        trackingNumber: null,
        status: "returned" as const,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([shipmentWithoutTracking]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const returnedEvent = result.events.find(
        (e) => e.type === "shipment_returned",
      );
      expect(returnedEvent).toBeDefined();
      expect(returnedEvent?.description).not.toContain("Tracking:");
    });

    it.skip("should handle payment status processing", async () => {
      const processingPayment = {
        ...mockPayment,
        status: "processing" as const,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([processingPayment]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const paymentInitiatedEvent = result.events.find(
        (e) => e.type === "payment_initiated",
      );
      expect(paymentInitiatedEvent).toBeDefined();

      // Should not have payment_completed or payment_failed events
      const paymentCompletedEvent = result.events.find(
        (e) => e.type === "payment_completed",
      );
      const paymentFailedEvent = result.events.find(
        (e) => e.type === "payment_failed",
      );
      expect(paymentCompletedEvent).toBeUndefined();
      expect(paymentFailedEvent).toBeUndefined();
    });

    it.skip("should sort events by timestamp (newest first)", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockPayment]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockShipment]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      // Check that events are sorted (newest first)
      for (let i = 0; i < result.events.length - 1; i++) {
        expect(
          result.events[i].timestamp.getTime(),
        ).toBeGreaterThanOrEqual(result.events[i + 1].timestamp.getTime());
      }
    });

    it.skip("should throw NotFoundException if order not found", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain);

      await expect(
        service.getTimeline(mockUserId, "non-existent-order"),
      ).rejects.toThrow(NotFoundException);
    });

    it.skip("should include status changed event when status is not pending", async () => {
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const statusChangedEvent = result.events.find(
        (e) => e.type === "status_changed",
      );
      expect(statusChangedEvent).toBeDefined();
      expect(statusChangedEvent?.newValue).toBe("shipped");
    });

    it.skip("should not include status changed event when status is pending", async () => {
      const pendingOrder = {
        ...mockOrder,
        status: "pending" as const,
      };

      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([pendingOrder]),
          }),
        }),
      };

      const mockPaymentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      const mockShipmentsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockPaymentsChain)
        .mockReturnValueOnce(mockShipmentsChain);

      const result = await service.getTimeline(mockUserId, mockOrderId);

      const statusChangedEvent = result.events.find(
        (e) => e.type === "status_changed",
      );
      expect(statusChangedEvent).toBeUndefined();
    });
  });

  describe("finalizeOrderFromPayment", () => {
    const mockCheckoutSessionId = "checkout-session-123";
    const mockPaymentIntentId = "order_razorpay_123";
    const mockProvider = "razorpay";

    const mockCheckoutMetadata = {
      userId: mockUserId,
      shippingAddressId: mockShippingAddressId,
      billingAddressId: mockBillingAddressId,
      shippingCost: 50,
      createdAt: new Date().toISOString(),
    };

    const mockSession = {
      sessionId: mockCheckoutSessionId,
      cartId: mockCartId,
      state: CheckoutState.PAYMENT_CONFIRMED,
      paymentIntentId: mockPaymentIntentId,
      orderId: null,
      updatedAt: new Date().toISOString(),
    };

    beforeEach(() => {
      // Mock checkout store methods
      (checkoutStore.getOrderByPaymentIntent as jest.Mock).mockResolvedValue(
        null,
      );
      (checkoutStore.getSession as jest.Mock).mockResolvedValue(mockSession);
      (checkoutStore.getCheckoutMetadata as jest.Mock).mockResolvedValue(
        mockCheckoutMetadata,
      );
      (checkoutStore.createOrderFromPayment as jest.Mock).mockImplementation(
        async (provider, paymentIntentId, orderId) => orderId,
      );
      (checkoutStore.setOrder as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.transitionState as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.acquireCheckoutLock as jest.Mock).mockResolvedValue(true);
      (checkoutStore.releaseCheckoutLock as jest.Mock).mockResolvedValue(
        undefined,
      );
      (checkoutStore.assertState as jest.Mock).mockResolvedValue(undefined);

      // Mock carts service
      (cartsService.getCart as jest.Mock).mockResolvedValue(mockCart);
      (cartsService.clearCart as jest.Mock).mockResolvedValue(undefined);

      // Mock inventory store
      (inventoryStore.releaseCartReservations as jest.Mock).mockResolvedValue(
        undefined,
      );
      (inventoryStore.incrementInventory as jest.Mock).mockResolvedValue(8);

      // Mock discounts service
      (discountsService.validateDiscount as jest.Mock).mockResolvedValue({
        isValid: false,
      });

      // Setup default db.select mock for finalizeOrderFromPayment tests
      // This will be overridden in individual tests as needed
      // Don't set a default mock here - let each test set up its own mocks
      // This prevents interference between tests
    });

    it("should return existing order if already created (idempotent)", async () => {
      const existingOrderId = "existing-order-123";
      (checkoutStore.getOrderByPaymentIntent as jest.Mock).mockResolvedValue(
        existingOrderId,
      );

      // Mock order fetch
      const mockOrder = {
        id: existingOrderId,
        customerId: mockCustomerId,
        orderNumber: "ORD-2025-000001",
        status: "pending",
        subtotal: 1000,
        gstAmount: 180,
        discountCode: null,
        discountAmount: 0,
        shippingCost: 50,
        total: 1230,
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        razorpayOrderId: mockPaymentIntentId,
        shippingProvider: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOrderItems = [
        {
          id: "order-item-123",
          orderId: existingOrderId,
          productVariantId: mockVariantId,
          quantity: 2,
          price: 500,
          gstRate: 18,
          gstAmount: 180,
        },
      ];

      // Mock order query: select().from().where().limit()
      const mockOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      // Mock order items query: select().from().where() - returns array directly
      const mockOrderItemsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      };

      // Mock shipping address query: select().from().where().limit()
      const mockShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      setupSelectMock(mockOrderChain, mockOrderItemsChain, mockShippingAddressChain);

      const result = await service.finalizeOrderFromPayment(
        mockCheckoutSessionId,
        mockPaymentIntentId,
        mockProvider,
      );

      expect(result.id).toBe(existingOrderId);
      expect(checkoutStore.getOrderByPaymentIntent).toHaveBeenCalledWith(
        mockProvider,
        mockPaymentIntentId,
      );
      // Should not create new order
      expect(db.insert).not.toHaveBeenCalled();
    });

    it.skip("should create order when payment is confirmed", async () => {
      // Mock getCustomerId: select().from().where().limit()
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      // Mock cart items with variants: select().from().innerJoin().innerJoin().where()
      const mockCartItemsAfterSecondJoin = {
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsAfterFirstJoin = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterSecondJoin),
      };
      const mockCartItemsFromResult = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterFirstJoin),
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsChain = {
        from: jest.fn().mockReturnValue(mockCartItemsFromResult),
      };

      // Mock generateOrderNumber: select().from().where().orderBy().limit()
      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      // Mock insert order
      const mockInsertOrderChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: mockOrderId,
            customerId: mockCustomerId,
            orderNumber: "ORD-2025-000001",
            status: "pending",
            subtotal: 1000,
            gstAmount: 180,
            discountCode: null,
            discountAmount: 0,
            shippingCost: 50,
            total: 1230,
            shippingAddressId: mockShippingAddressId,
            billingAddressId: mockBillingAddressId,
            razorpayOrderId: mockPaymentIntentId,
            shippingProvider: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };

      // Mock insert order items
      const mockInsertOrderItemsChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: "order-item-123",
            orderId: mockOrderId,
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            gstRate: 18,
            gstAmount: 180,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };

      // Mock shipping address query for GST calculation: select().from().where().limit()
      const mockShippingAddressForGstChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      setupSelectMock(mockCustomerChain, mockCartItemsChain, mockShippingAddressForGstChain, mockOrdersChain);

      (db.insert as jest.Mock).mockReset();
      (db.insert as jest.Mock)
        .mockReturnValueOnce(mockInsertOrderChain)
        .mockReturnValueOnce(mockInsertOrderItemsChain);

      const result = await service.finalizeOrderFromPayment(
        mockCheckoutSessionId,
        mockPaymentIntentId,
        mockProvider,
      );

      expect(result.id).toBe(mockOrderId);
      expect(result.razorpayOrderId).toBe(mockPaymentIntentId);
      expect(checkoutStore.createOrderFromPayment).toHaveBeenCalledWith(
        mockProvider,
        mockPaymentIntentId,
        mockOrderId,
      );
      expect(checkoutStore.transitionState).toHaveBeenCalledWith(
        mockCheckoutSessionId,
        CheckoutState.PAYMENT_CONFIRMED,
        CheckoutState.ORDER_CREATED,
      );
      expect(inventoryStore.releaseCartReservations).toHaveBeenCalledWith(
        mockCartId,
      );
      expect(inventoryStore.incrementInventory).toHaveBeenCalledWith(
        mockVariantId,
        -2,
      );
      expect(cartsService.clearCart).toHaveBeenCalledWith(mockUserId, null);
    });

    it.skip("should handle concurrent order creation (idempotent)", async () => {
      // Simulate concurrent creation - another process created order
      const concurrentOrderId = "concurrent-order-123";
      (checkoutStore.createOrderFromPayment as jest.Mock).mockResolvedValue(
        concurrentOrderId,
      );

      // Mock getCustomerId: select().from().where().limit()
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      // Mock cart items: select().from().innerJoin().innerJoin().where()
      const mockCartItemsAfterSecondJoin = {
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsAfterFirstJoin = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterSecondJoin),
      };
      const mockCartItemsFromResult = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterFirstJoin),
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsChain = {
        from: jest.fn().mockReturnValue(mockCartItemsFromResult),
      };

      // Mock generateOrderNumber: select().from().where().orderBy().limit()
      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      // Mock insert order
      const mockInsertOrderChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: mockOrderId,
            customerId: mockCustomerId,
            orderNumber: "ORD-2025-000001",
            status: "pending",
            subtotal: 1000,
            gstAmount: 180,
            discountCode: null,
            discountAmount: 0,
            shippingCost: 50,
            total: 1230,
            shippingAddressId: mockShippingAddressId,
            billingAddressId: mockBillingAddressId,
            razorpayOrderId: mockPaymentIntentId,
            shippingProvider: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };

      // Mock insert order items
      const mockInsertOrderItemsChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([]),
      };

      // Mock delete order (cleanup duplicate)
      const mockDeleteOrderChain = {
        where: jest.fn().mockResolvedValue(undefined),
      };

      // Mock shipping address query for GST calculation (first call): select().from().where().limit()
      const mockShippingAddressForGstChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      // Mock recursive call mocks - define before using
      const mockConcurrentOrder = {
        id: concurrentOrderId,
        customerId: mockCustomerId,
        orderNumber: "ORD-2025-000002",
        status: "pending",
        subtotal: 1000,
        gstAmount: 180,
        discountCode: null,
        discountAmount: 0,
        shippingCost: 50,
        total: 1230,
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        razorpayOrderId: mockPaymentIntentId,
        shippingProvider: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockConcurrentOrderChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockConcurrentOrder]),
          }),
        }),
      };

      const mockConcurrentOrderItemsChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      };

      const mockConcurrentShippingAddressChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      setupSelectMock(
        mockCustomerChain,
        mockCartItemsChain,
        mockShippingAddressForGstChain,
        mockOrdersChain,
        mockConcurrentOrderChain,
        mockConcurrentOrderItemsChain,
        mockConcurrentShippingAddressChain
      );

      (db.insert as jest.Mock)
        .mockReturnValueOnce(mockInsertOrderChain)
        .mockReturnValueOnce(mockInsertOrderItemsChain);

      (db.delete as jest.Mock).mockReturnValue(mockDeleteOrderChain);

      // Mock recursive call to return existing order
      (checkoutStore.getOrderByPaymentIntent as jest.Mock)
        .mockResolvedValueOnce(null) // First call - no order
        .mockResolvedValueOnce(concurrentOrderId); // After cleanup - order exists

      const result = await service.finalizeOrderFromPayment(
        mockCheckoutSessionId,
        mockPaymentIntentId,
        mockProvider,
      );

      // Should delete duplicate order and return existing one
      expect(db.delete).toHaveBeenCalled();
      expect(result.id).toBe(concurrentOrderId);
    });

    it("should throw error if checkout session not found", async () => {
      (checkoutStore.getSession as jest.Mock).mockResolvedValue(null);

      await expect(
        service.finalizeOrderFromPayment(
          mockCheckoutSessionId,
          mockPaymentIntentId,
          mockProvider,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw error if checkout metadata not found", async () => {
      (checkoutStore.getCheckoutMetadata as jest.Mock).mockResolvedValue(null);

      await expect(
        service.finalizeOrderFromPayment(
          mockCheckoutSessionId,
          mockPaymentIntentId,
          mockProvider,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw error if state is not PAYMENT_CONFIRMED", async () => {
      (checkoutStore.getSession as jest.Mock).mockResolvedValue({
        ...mockSession,
        state: CheckoutState.PAYMENT_PENDING,
      });

      await expect(
        service.finalizeOrderFromPayment(
          mockCheckoutSessionId,
          mockPaymentIntentId,
          mockProvider,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it.skip("should handle inventory commit failure gracefully", async () => {
      // Mock getCustomerId: select().from().where().limit()
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      // Mock cart items: select().from().innerJoin().innerJoin().where()
      const mockCartItemsAfterSecondJoin = {
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsAfterFirstJoin = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterSecondJoin),
      };
      const mockCartItemsFromResult = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterFirstJoin),
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsChain = {
        from: jest.fn().mockReturnValue(mockCartItemsFromResult),
      };

      // Mock generateOrderNumber: select().from().where().orderBy().limit()
      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      // Mock insert order
      const mockInsertOrderChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: mockOrderId,
            customerId: mockCustomerId,
            orderNumber: "ORD-2025-000001",
            status: "pending",
            subtotal: 1000,
            gstAmount: 180,
            discountCode: null,
            discountAmount: 0,
            shippingCost: 50,
            total: 1230,
            shippingAddressId: mockShippingAddressId,
            billingAddressId: mockBillingAddressId,
            razorpayOrderId: mockPaymentIntentId,
            shippingProvider: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };

      // Mock insert order items
      const mockInsertOrderItemsChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: "order-item-123",
            orderId: mockOrderId,
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            gstRate: 18,
            gstAmount: 180,
          },
        ]),
      };

      // Mock shipping address query for GST calculation: select().from().where().limit()
      const mockShippingAddressForGstChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      setupSelectMock(mockCustomerChain, mockCartItemsChain, mockShippingAddressForGstChain, mockOrdersChain);

      (db.insert as jest.Mock).mockReset();
      (db.insert as jest.Mock)
        .mockReturnValueOnce(mockInsertOrderChain)
        .mockReturnValueOnce(mockInsertOrderItemsChain);

      // Mock required checkout store methods
      (checkoutStore.acquireCheckoutLock as jest.Mock).mockResolvedValue(true);
      (checkoutStore.assertState as jest.Mock).mockResolvedValue(undefined);
      (cartsService.getCart as jest.Mock).mockResolvedValue(mockCart);
      (cartsService.clearCart as jest.Mock).mockResolvedValue(undefined);

      // Mock inventory commit failure
      (inventoryStore.releaseCartReservations as jest.Mock).mockRejectedValue(
        new Error("Redis error"),
      );
      (inventoryStore.incrementInventory as jest.Mock).mockResolvedValue(8);

      // Should still create order despite inventory failure
      const result = await service.finalizeOrderFromPayment(
        mockCheckoutSessionId,
        mockPaymentIntentId,
        mockProvider,
      );

      expect(result.id).toBe(mockOrderId);
      // Order should be created even if inventory commit fails
      expect(db.insert).toHaveBeenCalled();
    });

    it.skip("should handle inventory commit idempotency (multiple commits don't double-consume)", async () => {
      // Mock getCustomerId: select().from().where().limit()
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      // Mock cart items with variants: select().from().innerJoin().innerJoin().where()
      const mockCartItemsAfterSecondJoin = {
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsAfterFirstJoin = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterSecondJoin),
      };
      const mockCartItemsFromResult = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterFirstJoin),
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsChain = {
        from: jest.fn().mockReturnValue(mockCartItemsFromResult),
      };

      // Mock generateOrderNumber: select().from().where().orderBy().limit()
      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      // Mock insert order
      const mockInsertOrderChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: mockOrderId,
            customerId: mockCustomerId,
            orderNumber: "ORD-2025-000001",
            status: "pending",
            subtotal: 1000,
            gstAmount: 180,
            discountCode: null,
            discountAmount: 0,
            shippingCost: 50,
            total: 1230,
            shippingAddressId: mockShippingAddressId,
            billingAddressId: mockBillingAddressId,
            razorpayOrderId: mockPaymentIntentId,
            shippingProvider: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };

      // Mock insert order items
      const mockInsertOrderItemsChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: "order-item-123",
            orderId: mockOrderId,
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            gstRate: 18,
            gstAmount: 180,
          },
        ]),
      };

      // Mock shipping address query for GST calculation: select().from().where().limit()
      const mockShippingAddressForGstChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      setupSelectMock(mockCustomerChain, mockCartItemsChain, mockShippingAddressForGstChain, mockOrdersChain);

      (db.insert as jest.Mock)
        .mockReturnValueOnce(mockInsertOrderChain)
        .mockReturnValueOnce(mockInsertOrderItemsChain);

      // Mock inventory operations - track calls
      let inventoryDecrementCalls = 0;
      (inventoryStore.incrementInventory as jest.Mock).mockImplementation(
        async (variantId, delta) => {
          if (delta < 0) {
            inventoryDecrementCalls++;
          }
          return 8;
        },
      );

      // Mock required checkout store methods for first call
      (checkoutStore.acquireCheckoutLock as jest.Mock).mockResolvedValue(true);
      (checkoutStore.assertState as jest.Mock).mockResolvedValue(undefined);
      (cartsService.getCart as jest.Mock).mockResolvedValue(mockCart);
      (cartsService.clearCart as jest.Mock).mockResolvedValue(undefined);

      // First call - creates order and commits inventory
      await service.finalizeOrderFromPayment(
        mockCheckoutSessionId,
        mockPaymentIntentId,
        mockProvider,
      );

      const firstCallCount = inventoryDecrementCalls;

      // Reset mocks but keep order existing
      jest.clearAllMocks();
      (checkoutStore.getOrderByPaymentIntent as jest.Mock).mockResolvedValue(
        mockOrderId,
      );
      (checkoutStore.getSession as jest.Mock).mockResolvedValue(mockSession);
      (checkoutStore.getCheckoutMetadata as jest.Mock).mockResolvedValue(
        mockCheckoutMetadata,
      );
      (checkoutStore.acquireCheckoutLock as jest.Mock).mockResolvedValue(true);
      (checkoutStore.assertState as jest.Mock).mockResolvedValue(undefined);

      // Second call - should return existing order without committing inventory again
      const mockOrder = {
        id: mockOrderId,
        customerId: mockCustomerId,
        orderNumber: "ORD-2025-000001",
        status: "pending",
        subtotal: 1000,
        gstAmount: 180,
        discountCode: null,
        discountAmount: 0,
        shippingCost: 50,
        total: 1230,
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        razorpayOrderId: mockPaymentIntentId,
        shippingProvider: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOrderItems = [
        {
          id: "order-item-123",
          orderId: mockOrderId,
          productVariantId: mockVariantId,
          quantity: 2,
          price: 500,
          gstRate: 18,
          gstAmount: 180,
        },
      ];

      const mockOrderChain2 = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      };

      const mockOrderItemsChain2 = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockOrderItems),
        }),
      };

      // Mock shipping address for GST calculation
      const mockShippingAddressChain2 = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      // Mock db.select for order fetch (when existing order is found)
      // Need 3 calls: order, order items, shipping address
      (db.select as jest.Mock)
        .mockReturnValueOnce(mockOrderChain2)
        .mockReturnValueOnce(mockOrderItemsChain2)
        .mockReturnValueOnce(mockShippingAddressChain2);

      inventoryDecrementCalls = 0; // Reset counter

      await service.finalizeOrderFromPayment(
        mockCheckoutSessionId,
        mockPaymentIntentId,
        mockProvider,
      );

      // Inventory should not be decremented again (idempotent)
      expect(inventoryDecrementCalls).toBe(0);
      expect(inventoryStore.incrementInventory).not.toHaveBeenCalled();
      // Should have fetched existing order instead of creating new one
      expect(checkoutStore.getOrderByPaymentIntent).toHaveBeenCalledWith(
        mockProvider,
        mockPaymentIntentId,
      );
      expect(db.insert).not.toHaveBeenCalled();
    });

    it.skip("should throw error if trying to transition to ORDER_CREATED from invalid state", async () => {
      // Mock getCustomerId: select().from().where().limit()
      const mockCustomerChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockCustomer]),
          }),
        }),
      };

      // Mock cart items: select().from().innerJoin().innerJoin().where()
      const mockCartItemsAfterSecondJoin = {
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsAfterFirstJoin = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterSecondJoin),
      };
      const mockCartItemsFromResult = {
        innerJoin: jest.fn().mockReturnValue(mockCartItemsAfterFirstJoin),
        where: jest.fn().mockResolvedValue([
          {
            cartItemId: "cart-item-123",
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            productGstRate: 18,
          },
        ]),
      };
      const mockCartItemsChain = {
        from: jest.fn().mockReturnValue(mockCartItemsFromResult),
      };

      // Mock generateOrderNumber: select().from().where().orderBy().limit()
      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };

      // Mock insert order
      const mockInsertOrderChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: mockOrderId,
            customerId: mockCustomerId,
            orderNumber: "ORD-2025-000001",
            status: "pending",
            subtotal: 1000,
            gstAmount: 180,
            discountCode: null,
            discountAmount: 0,
            shippingCost: 50,
            total: 1230,
            shippingAddressId: mockShippingAddressId,
            billingAddressId: mockBillingAddressId,
            razorpayOrderId: mockPaymentIntentId,
            shippingProvider: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };

      // Mock insert order items
      const mockInsertOrderItemsChain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([
          {
            id: "order-item-123",
            orderId: mockOrderId,
            productVariantId: mockVariantId,
            quantity: 2,
            price: 500,
            gstRate: 18,
            gstAmount: 180,
          },
        ]),
      };

      // Mock shipping address query for GST calculation: select().from().where().limit()
      const mockShippingAddressForGstChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockShippingAddress]),
          }),
        }),
      };

      // Reset db.select mock to avoid interference from beforeEach default mock
      (db.select as jest.Mock).mockReset();
      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCustomerChain) // getCustomerId
        .mockReturnValueOnce(mockCartItemsChain) // cartItemsWithVariants
        .mockReturnValueOnce(mockShippingAddressForGstChain) // Shipping address for GST calculation
        .mockReturnValueOnce(mockOrdersChain); // generateOrderNumber

      (db.insert as jest.Mock)
        .mockReturnValueOnce(mockInsertOrderChain)
        .mockReturnValueOnce(mockInsertOrderItemsChain);

      // Mock transition failure - invalid state transition
      (checkoutStore.transitionState as jest.Mock).mockRejectedValue(
        new BadRequestException(
          "Cannot transition to ORDER_CREATED from PAYMENT_PENDING",
        ),
      );

      // Mock other required methods
      (checkoutStore.acquireCheckoutLock as jest.Mock).mockResolvedValue(true);
      (checkoutStore.assertState as jest.Mock).mockResolvedValue(undefined);
      (cartsService.getCart as jest.Mock).mockResolvedValue(mockCart);
      (inventoryStore.releaseCartReservations as jest.Mock).mockResolvedValue(
        undefined,
      );
      (inventoryStore.incrementInventory as jest.Mock).mockResolvedValue(8);
      (cartsService.clearCart as jest.Mock).mockResolvedValue(undefined);

      // Order should still be created, but transition failure is logged
      const result = await service.finalizeOrderFromPayment(
        mockCheckoutSessionId,
        mockPaymentIntentId,
        mockProvider,
      );

      expect(result.id).toBe(mockOrderId);
      // Transition should have been attempted
      expect(checkoutStore.transitionState).toHaveBeenCalled();
    });
  });
});
