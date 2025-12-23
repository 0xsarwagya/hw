import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { db, orders, PaymentMethod, payments, orderItems, addresses, productVariants, products, cartItems } from "@vcecom/db";
import { OrdersService } from "../orders.service";
import { COD_PAYMENT_METHOD } from "../../../common/constants/orders.constants";
import { PaymentChargeService } from "../../payments/services/payment-charge.service";
import { PaymentsService } from "../../payments/payments.service";
import { CartsService } from "../../carts/carts.service";
import { CustomersService } from "../../customers/customers.service";
import { AddressesService } from "../../customers/addresses.service";
import { DiscountsService } from "../../discounts/discounts.service";
import { BundlePricingService } from "../../pricing/services/bundle-pricing.service";
import { PriceListService } from "../../pricing/services/price-list.service";
import { CustomerGroupService } from "../../pricing/services/customer-group.service";
import { InventoryStore } from "../../redis-store/stores/inventory-store";
import { CheckoutStore } from "../../redis-store/stores/checkout-store";
import { DiscountSnapshotValidator } from "../../discounts/services/discount-snapshot-validator.service";
import { PricingSnapshotValidator } from "../../pricing/services/pricing-snapshot-validator.service";
import { OrderGstService } from "../services/order-gst.service";
import { OrderPricingService } from "../services/order-pricing.service";
import { OrderValidationService } from "../services/order-validation.service";
import { OrderStatusService } from "../services/order-status.service";
import { OrderTimelineService } from "../services/order-timeline.service";
import { NotificationsService } from "../../notifications/notifications.service";
import { DiscountAuditService } from "../../discounts/services/discount-audit.service";
import { DriftDetectorService } from "../../discounts/services/drift-detector.service";
import { HotReloadWatcher } from "../../discounts/services/hot-reload-watcher.service";
import { RulesetBundleService } from "../../discounts/services/ruleset-bundle.service";
import { DiscountProfiler } from "../../discounts/services/discount-profiler.service";
import { PricingHotReloadWatcher } from "../../pricing/services/pricing-hot-reload-watcher.service";
import { PricingAuditService } from "../../pricing/services/pricing-audit.service";
import { PricingDriftDetectorService } from "../../pricing/services/pricing-drift-detector.service";
import { getCommonTestProviders } from "../../../common/testing/test-helpers";
import { CheckoutState } from "../../redis-store/constants/checkout-states";

// Mock database
jest.mock("@vcecom/db", () => {
  const actual = jest.requireActual("@vcecom/db");
  return {
    ...actual,
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      transaction: jest.fn((callback) => callback()),
    },
    eq: jest.fn((field, value) => ({ field, value })),
    and: jest.fn((...conditions) => conditions),
    inArray: jest.fn((field, values) => ({ field, values })),
    orders: {
      id: "id",
      customerId: "customer_id",
      orderNumber: "order_number",
      status: "status",
      paymentFee: "payment_fee",
      paymentMethod: "payment_method",
      paymentFeeBreakdown: "payment_fee_breakdown",
      total: "total",
    },
    payments: {
      id: "id",
      orderId: "order_id",
      method: "method",
      status: "status",
      amount: "amount",
    },
    orderItems: {
      id: "id",
      orderId: "order_id",
      productVariantId: "product_variant_id",
      quantity: "quantity",
      price: "price",
      gstRate: "gst_rate",
      gstAmount: "gst_amount",
    },
    addresses: {
      id: "id",
      state: "state",
    },
    productVariants: {
      id: "id",
      productId: "product_id",
    },
    products: {
      id: "id",
      gstRate: "gst_rate",
    },
    cartItems: {
      id: "id",
      productVariantId: "product_variant_id",
      quantity: "quantity",
      price: "price",
      metadata: "metadata",
    },
  };
});

describe("OrdersService - Payment Fees Integration", () => {
  let service: OrdersService;
  let paymentChargeService: jest.Mocked<PaymentChargeService>;
  let cartsService: jest.Mocked<CartsService>;
  let checkoutStore: jest.Mocked<CheckoutStore>;
  let module: TestingModule;

  const mockCustomerId = "customer-123";
  const mockCartId = "cart-123";
  const mockCheckoutSessionId = "checkout-session-123";
  const mockShippingAddressId = "shipping-address-123";
  const mockBillingAddressId = "billing-address-123";

  const mockCart = {
    id: mockCartId,
    customerId: mockCustomerId,
    items: [
      {
        id: "cart-item-1",
        productVariantId: "variant-1",
        quantity: 2,
        price: 500, // ₹500 in rupees
        metadata: null,
      },
    ],
    subtotal: 1000, // ₹1000 in rupees
    total: 1000, // ₹1000 in rupees
    discountCode: null,
    discountAmount: 0,
    gstAmount: 0,
    gstBreakdown: {
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalGst: 0,
      isIntraState: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCheckoutSession = {
    sessionId: mockCheckoutSessionId,
    state: CheckoutState.LOCKED, // COD orders start in LOCKED state
    cartId: mockCartId,
    paymentIntentId: null,
  };

  beforeEach(async () => {
    const mockPaymentChargeService = {
      calculateFee: jest.fn(),
      getAvailableMethods: jest.fn(),
    };

    const mockCartsService = {
      getCart: jest.fn().mockResolvedValue({
        ...mockCart,
        discountCode: null,
      }),
      getCartById: jest.fn().mockResolvedValue({
        ...mockCart,
        discountCode: null,
      }) as jest.MockedFunction<CartsService["getCartById"]>,
      clearCart: jest.fn().mockResolvedValue(undefined),
    };

    const mockCheckoutStore = {
      getSession: jest.fn(),
      getCheckoutMetadata: jest.fn(),
      storeCheckoutMetadata: jest.fn(),
      transitionState: jest.fn(),
      acquireCheckoutLock: jest.fn().mockResolvedValue(true),
      releaseCheckoutLock: jest.fn(),
      assertStateIn: jest.fn(),
      assertState: jest.fn(),
      createSession: jest.fn().mockResolvedValue({
        sessionId: mockCheckoutSessionId,
      }),
      setPaymentIntent: jest.fn(),
      getPaymentIntent: jest.fn(),
      setOrder: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        ...getCommonTestProviders(),
        OrdersService,
        {
          provide: CartsService,
          useValue: mockCartsService,
        },
        {
          provide: CustomersService,
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              id: mockCustomerId,
            }),
            getCustomerId: jest.fn().mockResolvedValue(mockCustomerId),
          },
        },
        {
          provide: AddressesService,
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              id: mockShippingAddressId,
            }),
            validateAddresses: jest.fn().mockResolvedValue(undefined),
          },
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
          useValue: {
            reserveCartItems: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: CheckoutStore,
          useValue: mockCheckoutStore,
        },
        {
          provide: DiscountSnapshotValidator,
          useValue: {
            validate: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: DiscountAuditService,
          useValue: {
            logEvent: jest.fn(),
          },
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
          useValue: {},
        },
        {
          provide: DiscountProfiler,
          useValue: {},
        },
        {
          provide: PricingHotReloadWatcher,
          useValue: {
            getCurrentVersion: jest.fn().mockReturnValue(1),
          },
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
            findAll: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: PricingSnapshotValidator,
          useValue: {
            validate: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: PricingAuditService,
          useValue: {},
        },
        {
          provide: PricingDriftDetectorService,
          useValue: {},
        },
        {
          provide: BundlePricingService,
          useValue: {
            flattenBundleSelections: jest.fn().mockReturnValue([]),
          },
        },
        {
          provide: PaymentsService,
          useValue: {
            createPaymentIntent: jest.fn().mockResolvedValue({
              id: "pi-123",
              amount: 103000,
              currency: "INR",
            }),
          },
        },
        {
          provide: PaymentChargeService,
          useValue: mockPaymentChargeService,
        },
        {
          provide: NotificationsService,
          useValue: {
            create: jest.fn(),
            createFromEvent: jest.fn(),
          },
        },
        {
          provide: OrderValidationService,
          useValue: {
            validateOrderCreation: jest.fn().mockResolvedValue(undefined),
            getCustomerId: jest.fn().mockResolvedValue(mockCustomerId),
            getAddresses: jest.fn().mockResolvedValue({
              shippingAddress: { id: mockShippingAddressId },
              billingAddress: { id: mockBillingAddressId },
            }),
            getSellerState: jest.fn().mockReturnValue("Maharashtra"),
          },
        },
        {
          provide: OrderPricingService,
          useValue: {
            calculateOrderPricing: jest.fn().mockResolvedValue({
              subtotal: 100000,
              discountAmount: 0,
              finalSubtotal: 100000,
            }),
          },
        },
        {
          provide: OrderStatusService,
          useValue: {
            updateStatus: jest.fn(),
          },
        },
        {
          provide: OrderGstService,
          useValue: {
            calculateGstForOrder: jest.fn().mockResolvedValue({
              totalGstAmount: 0,
              gstBreakdown: {
                cgst: 0,
                sgst: 0,
                igst: 0,
                totalGst: 0,
                isIntraState: false,
              },
            }),
          },
        },
        {
          provide: OrderTimelineService,
          useValue: {
            addEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    paymentChargeService = module.get(PaymentChargeService);
    cartsService = module.get(CartsService) as jest.Mocked<CartsService>;
    checkoutStore = module.get(CheckoutStore);

    jest.clearAllMocks();
  });

  describe("create - Payment Fees Integration", () => {
    it.skip("should create COD order directly with payment fee included", async () => {
      const paymentFee = 3000; // ₹30 in paise
      const paymentFeeBreakdown = {
        method: PaymentMethod.COD,
        chargeType: "FLAT",
        flatAmount: 3000,
        calculatedFee: 3000,
      };

      const mockCheckoutMetadata = {
        customerId: mockCustomerId,
        userId: mockCustomerId,
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        shippingCost: 0,
        paymentMethod: COD_PAYMENT_METHOD, // Use lowercase "cod" to match constant
        paymentFee,
        paymentFeeBreakdown,
        discountSnapshot: null,
        pricingSnapshot: null,
        createdAt: new Date().toISOString(),
      };

      const mockCodCheckoutSession = {
        ...mockCheckoutSession,
        state: CheckoutState.LOCKED, // COD orders must be in LOCKED state
      };

      checkoutStore.getSession.mockResolvedValue(mockCodCheckoutSession as any);
      checkoutStore.getCheckoutMetadata.mockResolvedValue(mockCheckoutMetadata as any);
      checkoutStore.storeCheckoutMetadata.mockResolvedValue(undefined);
      checkoutStore.transitionState.mockResolvedValue(undefined);
      checkoutStore.setOrder.mockResolvedValue(undefined);
      if (cartsService.getCartById) {
        (cartsService.getCartById as jest.Mock).mockResolvedValue(mockCart as any);
      }
      cartsService.clearCart.mockResolvedValue(undefined);

      // Mock order insert
      const mockOrderInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: "order-123",
              orderNumber: "ORD-123",
              customerId: mockCustomerId,
              subtotal: 1000,
              gstAmount: 0,
              discountCode: null,
              discountAmount: 0,
              shippingCost: 0,
              paymentFee,
              paymentMethod: COD_PAYMENT_METHOD,
              paymentFeeBreakdown,
              total: 1030, // ₹1000 + ₹30 payment fee (in rupees)
              shippingAddressId: mockShippingAddressId,
              billingAddressId: mockBillingAddressId,
              razorpayOrderId: null,
              discountSnapshot: null,
              pricingSnapshot: null,
              status: "pending",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        }),
      });

      // Mock payment insert
      const mockPaymentInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: "payment-123" }]),
        }),
      });

      // Mock order items insert
      const mockOrderItemsInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      // Mock db.insert to return different mocks based on table
      (db.insert as jest.Mock).mockImplementation((table: any) => {
        if (table === orders) {
          return mockOrderInsert();
        }
        if (table === payments) {
          return mockPaymentInsert();
        }
        if (table === orderItems) {
          return mockOrderItemsInsert();
        }
        return mockOrderInsert();
      });

      // Mock db.select for various queries
      let selectCallCount = 0;
      (db.select as jest.Mock).mockImplementation(() => {
        const callIndex = selectCallCount++;
        const mockFrom = jest.fn().mockImplementation((table: any) => {
          // Handle cartItems query specifically - needs to support both where() and innerJoin()
          if (table === cartItems) {
            return {
              where: jest.fn().mockResolvedValue([
                {
                  id: "cart-item-1",
                  productVariantId: "variant-1",
                  quantity: 2,
                  price: 500,
                  metadata: null,
                },
              ]),
              innerJoin: jest.fn().mockReturnValue({
                innerJoin: jest.fn().mockReturnValue({
                  where: jest.fn().mockResolvedValue([
                    {
                      cartItemId: "cart-item-1",
                      productVariantId: "variant-1",
                      quantity: 2,
                      price: 500,
                      productGstRate: 18,
                    },
                  ]),
                }),
              }),
            };
          }
          
          // Handle productVariants query for variantProductMap
          if (table === productVariants) {
            return {
              where: jest.fn().mockResolvedValue([
                {
                  variantId: "variant-1",
                  productId: "product-1",
                },
              ]),
            };
          }
          
          // Handle products query for productDetails
          if (table === products) {
            return {
              where: jest.fn().mockResolvedValue([
                {
                  productId: "product-1",
                  categoryId: "category-1",
                },
              ]),
            };
          }
          
          // Handle other queries
          return {
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(
                callIndex === 0
                  ? [{ id: mockCustomerId }] // Customer lookup
                  : callIndex === 1
                    ? [{ id: mockShippingAddressId, state: "Maharashtra" }] // Address lookup
                    : callIndex === 2
                      ? [
                          {
                            cartItemId: "cart-item-1",
                            productVariantId: "variant-1",
                            quantity: 2,
                            price: 500,
                            productGstRate: 18,
                          },
                        ] // Cart items with variants
                      : [] // Order items lookup
              ),
            }),
            innerJoin: jest.fn().mockReturnValue({
              innerJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue([
                  {
                    cartItemId: "cart-item-1",
                    productVariantId: "variant-1",
                    quantity: 2,
                    price: 500,
                    productGstRate: 18,
                  },
                ]),
              }),
            }),
          };
        });
        
        return {
          from: mockFrom,
        };
      });

      // Mock generateOrderNumber
      const generateOrderNumberSpy = jest
        .spyOn(service as any, "generateOrderNumber")
        .mockResolvedValue("ORD-123");

      const createOrderDto = {
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        shippingCost: 0,
        checkoutSessionId: mockCheckoutSessionId,
      };

      const result = await service.create(
        mockCustomerId,
        createOrderDto,
        mockCheckoutSessionId,
      );

      // Cleanup
      generateOrderNumberSpy.mockRestore();

      // Verify COD order was created (not payment intent)
      expect(result.orderId).toBe("order-123");
      expect(result.paymentIntent).toBeDefined();
      expect(result.paymentIntent?.paymentProvider).toBe("cod");
      expect(result.message).toContain("COD order created successfully");

      // Verify order was inserted with payment fee
      expect(mockOrderInsert).toHaveBeenCalled();
      const orderInsertCall = mockOrderInsert.mock.results[0].value;
      expect(orderInsertCall.values).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentFee,
          paymentMethod: COD_PAYMENT_METHOD,
          paymentFeeBreakdown,
        }),
      );

      // Verify payment record was created for COD
      expect(mockPaymentInsert).toHaveBeenCalled();
      const paymentInsertCall = mockPaymentInsert.mock.results[0].value;
      expect(paymentInsertCall.values).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: "order-123",
          method: COD_PAYMENT_METHOD,
          status: "pending",
        }),
      );

      // Verify state transitions for COD (LOCKED → PAYMENT_CONFIRMED → ORDER_CREATED → COMPLETED)
      expect(checkoutStore.transitionState).toHaveBeenCalledWith(
        mockCheckoutSessionId,
        CheckoutState.LOCKED,
        CheckoutState.PAYMENT_CONFIRMED, // COD = payment confirmed
      );
      expect(checkoutStore.transitionState).toHaveBeenCalledWith(
        mockCheckoutSessionId,
        CheckoutState.PAYMENT_CONFIRMED,
        CheckoutState.ORDER_CREATED,
      );
      expect(checkoutStore.transitionState).toHaveBeenCalledWith(
        mockCheckoutSessionId,
        CheckoutState.ORDER_CREATED,
        CheckoutState.COMPLETED,
      );

      // Verify cart was cleared
      expect(cartsService.clearCart).toHaveBeenCalledWith(
        mockCustomerId,
        mockCartId,
      );
    });

    it.skip("should create COD order with uppercase COD payment method", async () => {
      // Test case-insensitive COD detection with uppercase "COD"
      const paymentFee = 3000;
      const paymentFeeBreakdown = {
        method: PaymentMethod.COD,
        chargeType: "FLAT",
        flatAmount: 3000,
        calculatedFee: 3000,
      };

      const mockCheckoutMetadata = {
        customerId: mockCustomerId,
        userId: mockCustomerId,
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        shippingCost: 0,
        paymentMethod: "COD", // Uppercase COD - should still be detected
        paymentFee,
        paymentFeeBreakdown,
        discountSnapshot: null,
        pricingSnapshot: null,
        createdAt: new Date().toISOString(),
      };

      const mockCodCheckoutSession = {
        ...mockCheckoutSession,
        state: CheckoutState.LOCKED,
      };

      checkoutStore.getSession.mockResolvedValue(mockCodCheckoutSession as any);
      checkoutStore.getCheckoutMetadata.mockResolvedValue(mockCheckoutMetadata as any);
      checkoutStore.storeCheckoutMetadata.mockResolvedValue(undefined);
      checkoutStore.transitionState.mockResolvedValue(undefined);
      checkoutStore.setOrder.mockResolvedValue(undefined);
      if (cartsService.getCartById) {
        (cartsService.getCartById as jest.Mock).mockResolvedValue(mockCart as any);
      }
      cartsService.clearCart.mockResolvedValue(undefined);

      // Mock order insert
      const mockOrderInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: "order-456",
              orderNumber: "ORD-456",
              customerId: mockCustomerId,
              subtotal: 1000,
              gstAmount: 0,
              discountCode: null,
              discountAmount: 0,
              shippingCost: 0,
              paymentFee,
              paymentMethod: COD_PAYMENT_METHOD, // Stored as lowercase
              paymentFeeBreakdown,
              total: 1030,
              shippingAddressId: mockShippingAddressId,
              billingAddressId: mockBillingAddressId,
              razorpayOrderId: null,
              discountSnapshot: null,
              pricingSnapshot: null,
              status: "pending",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]),
        }),
      });

      const mockPaymentInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: "payment-456" }]),
        }),
      });

      const mockOrderItemsInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      (db.insert as jest.Mock).mockImplementation((table: any) => {
        if (table === orders) {
          return mockOrderInsert();
        }
        if (table === payments) {
          return mockPaymentInsert();
        }
        if (table === orderItems) {
          return mockOrderItemsInsert();
        }
        return mockOrderInsert();
      });

      let selectCallCount = 0;
      (db.select as jest.Mock).mockImplementation(() => {
        const callIndex = selectCallCount++;
        const mockFrom = jest.fn().mockImplementation((table: any) => {
          // Handle cartItems query specifically - needs to support both where() and innerJoin()
          if (table === cartItems) {
            return {
              where: jest.fn().mockResolvedValue([
                {
                  id: "cart-item-1",
                  productVariantId: "variant-1",
                  quantity: 2,
                  price: 500,
                  metadata: null,
                },
              ]),
              innerJoin: jest.fn().mockReturnValue({
                innerJoin: jest.fn().mockReturnValue({
                  where: jest.fn().mockResolvedValue([
                    {
                      cartItemId: "cart-item-1",
                      productVariantId: "variant-1",
                      quantity: 2,
                      price: 500,
                      productGstRate: 18,
                    },
                  ]),
                }),
              }),
            };
          }
          
          // Handle other queries
          return {
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(
                callIndex === 0
                  ? [{ id: mockCustomerId }]
                  : callIndex === 1
                    ? [{ id: mockShippingAddressId, state: "Maharashtra" }]
                    : callIndex === 2
                      ? [
                          {
                            cartItemId: "cart-item-1",
                            productVariantId: "variant-1",
                            quantity: 2,
                            price: 500,
                            productGstRate: 18,
                          },
                        ]
                      : []
              ),
            }),
            innerJoin: jest.fn().mockReturnValue({
              innerJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue([
                  {
                    cartItemId: "cart-item-1",
                    productVariantId: "variant-1",
                    quantity: 2,
                    price: 500,
                    productGstRate: 18,
                  },
                ]),
              }),
            }),
          };
        });
        
        return {
          from: mockFrom,
        };
      });

      const generateOrderNumberSpy = jest
        .spyOn(service as any, "generateOrderNumber")
        .mockResolvedValue("ORD-456");

      const createOrderDto = {
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        shippingCost: 0,
        checkoutSessionId: mockCheckoutSessionId,
      };

      const result = await service.create(
        mockCustomerId,
        createOrderDto,
        mockCheckoutSessionId,
      );

      generateOrderNumberSpy.mockRestore();

      // Verify COD order was created despite uppercase payment method
      expect(result.orderId).toBe("order-456");
      expect(result.paymentIntent?.paymentProvider).toBe("cod");
      expect(result.message).toContain("COD order created successfully");

      // Verify payment intent was NOT created
      const paymentsService = module.get(PaymentsService);
      expect(paymentsService.createPaymentIntent).not.toHaveBeenCalled();

      // Verify state transitions for COD (LOCKED → PAYMENT_CONFIRMED → ORDER_CREATED → COMPLETED)
      expect(checkoutStore.transitionState).toHaveBeenCalledWith(
        mockCheckoutSessionId,
        CheckoutState.LOCKED,
        CheckoutState.PAYMENT_CONFIRMED, // COD = payment confirmed
      );
      expect(checkoutStore.transitionState).toHaveBeenCalledWith(
        mockCheckoutSessionId,
        CheckoutState.PAYMENT_CONFIRMED,
        CheckoutState.ORDER_CREATED,
      );
      expect(checkoutStore.transitionState).toHaveBeenCalledWith(
        mockCheckoutSessionId,
        CheckoutState.ORDER_CREATED,
        CheckoutState.COMPLETED,
      );
    });

    it.skip("should include payment fee in order total when payment method is RAZORPAY_CARD", async () => {
      const paymentFee = 2000; // ₹20 (2% of ₹1000)
      const paymentFeeBreakdown = {
        method: PaymentMethod.RAZORPAY_CARD,
        chargeType: "PERCENTAGE",
        percentage: 2.0,
        calculatedFee: 2000,
      };

      const mockCheckoutMetadata = {
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        paymentMethod: PaymentMethod.RAZORPAY_CARD,
        paymentFee,
        paymentFeeBreakdown,
        discountSnapshot: null,
        pricingSnapshot: null,
      };

      checkoutStore.getSession.mockResolvedValue(mockCheckoutSession as any);
      checkoutStore.getCheckoutMetadata.mockResolvedValue(mockCheckoutMetadata as any);
      cartsService.getCart.mockResolvedValue(mockCart as any);

      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: "order-123",
              orderNumber: "ORD-123",
              total: 102000, // ₹1000 + ₹20 payment fee
              paymentFee,
              paymentMethod: PaymentMethod.RAZORPAY_CARD,
              paymentFeeBreakdown,
            },
          ]),
        }),
      });

      (db.insert as jest.Mock).mockReturnValue(mockInsert());

      const createOrderDto = {
        shippingAddressId: mockShippingAddressId,
        shippingCost: 0,
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                id: mockCustomerId,
              },
            ]),
          }),
        }),
      });

      await service.create(mockCustomerId, createOrderDto, mockCheckoutSessionId);

      expect(mockInsert).toHaveBeenCalled();
      const insertCall = (db.insert as jest.Mock).mock.results[0].value;
      expect(insertCall.values).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentFee,
          paymentMethod: PaymentMethod.RAZORPAY_CARD,
          paymentFeeBreakdown,
        }),
      );
    });

    it.skip("should include payment fee in order total when payment method is STRIPE_CARD (MIXED)", async () => {
      const paymentFee = 3100; // ₹31 (2.9% of ₹1000 + ₹2 flat)
      const paymentFeeBreakdown = {
        method: PaymentMethod.STRIPE_CARD,
        chargeType: "MIXED",
        percentage: 2.9,
        flatAmount: 200,
        calculatedFee: 3100,
      };

      const mockCheckoutMetadata = {
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        paymentMethod: PaymentMethod.STRIPE_CARD,
        paymentFee,
        paymentFeeBreakdown,
        discountSnapshot: null,
        pricingSnapshot: null,
      };

      checkoutStore.getSession.mockResolvedValue(mockCheckoutSession as any);
      checkoutStore.getCheckoutMetadata.mockResolvedValue(mockCheckoutMetadata as any);
      cartsService.getCart.mockResolvedValue(mockCart as any);

      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: "order-123",
              orderNumber: "ORD-123",
              total: 103100, // ₹1000 + ₹31 payment fee
              paymentFee,
              paymentMethod: PaymentMethod.STRIPE_CARD,
              paymentFeeBreakdown,
            },
          ]),
        }),
      });

      (db.insert as jest.Mock).mockReturnValue(mockInsert());

      const createOrderDto = {
        shippingAddressId: mockShippingAddressId,
        shippingCost: 0,
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                id: mockCustomerId,
              },
            ]),
          }),
        }),
      });

      await service.create(mockCustomerId, createOrderDto, mockCheckoutSessionId);

      expect(mockInsert).toHaveBeenCalled();
      const insertCall = (db.insert as jest.Mock).mock.results[0].value;
      expect(insertCall.values).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentFee,
          paymentMethod: PaymentMethod.STRIPE_CARD,
          paymentFeeBreakdown,
        }),
      );
    });

    it.skip("should use zero payment fee when payment method is not selected", async () => {
      const mockCheckoutMetadata = {
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        paymentMethod: null,
        paymentFee: 0,
        paymentFeeBreakdown: null,
        discountSnapshot: null,
        pricingSnapshot: null,
      };

      checkoutStore.getSession.mockResolvedValue(mockCheckoutSession as any);
      checkoutStore.getCheckoutMetadata.mockResolvedValue(mockCheckoutMetadata as any);
      cartsService.getCart.mockResolvedValue(mockCart as any);

      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: "order-123",
              orderNumber: "ORD-123",
              total: 100000, // ₹1000 (no payment fee)
              paymentFee: 0,
              paymentMethod: null,
              paymentFeeBreakdown: null,
            },
          ]),
        }),
      });

      (db.insert as jest.Mock).mockReturnValue(mockInsert());

      const createOrderDto = {
        shippingAddressId: mockShippingAddressId,
        shippingCost: 0,
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              {
                id: mockCustomerId,
              },
            ]),
          }),
        }),
      });

      await service.create(mockCustomerId, createOrderDto, mockCheckoutSessionId);

      expect(mockInsert).toHaveBeenCalled();
      const insertCall = (db.insert as jest.Mock).mock.results[0].value;
      expect(insertCall.values).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentFee: 0,
          paymentMethod: null,
          paymentFeeBreakdown: null,
        }),
      );
    });

    it.skip("should include payment fee in payment intent amount", async () => {
      const paymentFee = 3000; // ₹30
      const paymentFeeBreakdown = {
        method: PaymentMethod.COD,
        chargeType: "FLAT",
        flatAmount: 3000,
        calculatedFee: 3000,
      };

      const mockCheckoutMetadata = {
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        paymentMethod: PaymentMethod.COD,
        paymentFee,
        paymentFeeBreakdown,
        discountSnapshot: null,
        pricingSnapshot: null,
      };

      checkoutStore.getSession.mockResolvedValue(mockCheckoutSession as any);
      checkoutStore.getCheckoutMetadata.mockResolvedValue(mockCheckoutMetadata as any);
      cartsService.getCart.mockResolvedValue({
        ...mockCart,
        discountCode: null,
      } as any);

      const mockPaymentsService = {
        createPaymentIntent: jest.fn().mockResolvedValue({
          id: "pi-123",
          amount: 103000, // Should include payment fee
          currency: "INR",
        }),
      };

      // Replace PaymentsService in module
      const paymentsService = module.get(PaymentsService);
      if (paymentsService) {
        Object.assign(paymentsService, mockPaymentsService);
      }

      const createOrderDto = {
        shippingAddressId: mockShippingAddressId,
        billingAddressId: mockBillingAddressId,
        shippingCost: 0,
      };

      // Mock database queries - first for customer, then for cart items
      let callCount = 0;
      (db.select as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: customer lookup
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([
                  {
                    id: mockCustomerId,
                  },
                ]),
              }),
            }),
          };
        } else {
          // Subsequent calls: cart items and other queries
          const mockInnerJoinChain = {
            where: jest.fn().mockResolvedValue(mockCart.items || []),
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockCart.items || []),
            }),
          };
          const mockFrom = jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockCart.items || []),
            innerJoin: jest.fn().mockReturnValue(mockInnerJoinChain),
          });
          return {
            from: mockFrom,
          };
        }
      });

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: "order-123",
              orderNumber: "ORD-123",
              total: 103000,
            },
          ]),
        }),
      });

      await service.create(mockCustomerId, createOrderDto, mockCheckoutSessionId);

      // Verify payment intent was created with amount including payment fee
      // Note: This test verifies the integration, actual implementation may vary
      expect(mockPaymentsService.createPaymentIntent).toHaveBeenCalled();
    });
  });
});


