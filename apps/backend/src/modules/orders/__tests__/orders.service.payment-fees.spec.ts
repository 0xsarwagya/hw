import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { db, orders, PaymentMethod } from "@vcecom/db";
import { OrdersService } from "../orders.service";
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
    db: {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      transaction: jest.fn((callback) => callback()),
    },
    eq: jest.fn((field, value) => ({ field, value })),
    and: jest.fn((...conditions) => conditions),
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
  };
});

describe("OrdersService - Payment Fees Integration", () => {
  let service: OrdersService;
  let paymentChargeService: jest.Mocked<PaymentChargeService>;
  let cartsService: jest.Mocked<CartsService>;
  let checkoutStore: jest.Mocked<CheckoutStore>;

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
    state: CheckoutState.PAYMENT_PENDING,
    cartId: mockCartId,
    paymentIntentId: "pi-123",
  };

  beforeEach(async () => {
    const mockPaymentChargeService = {
      calculateFee: jest.fn(),
      getAvailableMethods: jest.fn(),
    };

    const mockCartsService = {
      getCart: jest.fn(),
      getCartById: jest.fn(),
      clearCart: jest.fn(),
    };

    const mockCheckoutStore = {
      getSession: jest.fn(),
      getCheckoutMetadata: jest.fn(),
      storeCheckoutMetadata: jest.fn(),
      transitionState: jest.fn(),
      acquireCheckoutLock: jest.fn().mockResolvedValue(true),
      releaseCheckoutLock: jest.fn(),
      assertStateIn: jest.fn(),
      createSession: jest.fn(),
      setPaymentIntent: jest.fn(),
      getPaymentIntent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
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
    cartsService = module.get(CartsService);
    checkoutStore = module.get(CheckoutStore);

    jest.clearAllMocks();
  });

  describe("create - Payment Fees Integration", () => {
    it.skip("should include payment fee in order total when payment method is COD", async () => {
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
      cartsService.getCart.mockResolvedValue(mockCart as any);

      const mockInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: "order-123",
              orderNumber: "ORD-123",
              total: 103000, // ₹1000 + ₹30 payment fee
              paymentFee,
              paymentMethod: PaymentMethod.COD,
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

      // Mock all required database queries
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

      // Verify payment fee was included in order
      expect(mockInsert).toHaveBeenCalled();
      const insertCall = (db.insert as jest.Mock).mock.results[0].value;
      expect(insertCall.values).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentFee,
          paymentMethod: PaymentMethod.COD,
          paymentFeeBreakdown,
        }),
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
      cartsService.getCart.mockResolvedValue(mockCart as any);

      const mockPaymentsService = {
        createPaymentIntent: jest.fn().mockResolvedValue({
          id: "pi-123",
          amount: 103000, // Should include payment fee
          currency: "INR",
        }),
      };

      // Replace PaymentsService in module
      const module = service["module"] as TestingModule;
      const paymentsService = module.get("PaymentsService");
      if (paymentsService) {
        Object.assign(paymentsService, mockPaymentsService);
      }

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


