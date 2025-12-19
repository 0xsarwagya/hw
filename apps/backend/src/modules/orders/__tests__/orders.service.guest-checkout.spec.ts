import { BadRequestException, ConflictException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import { getCommonTestProviders } from "../../../common/testing/test-helpers";
import { AddressesService } from "../../customers/addresses.service";
import { CustomersService } from "../../customers/customers.service";
import { CartsService } from "../../carts/carts.service";
import { DiscountsService } from "../../discounts/discounts.service";
import { DiscountAuditService } from "../../discounts/services/discount-audit.service";
import { DiscountSnapshotValidator } from "../../discounts/services/discount-snapshot-validator.service";
import { DriftDetectorService } from "../../discounts/services/drift-detector.service";
import { HotReloadWatcher } from "../../discounts/services/hot-reload-watcher.service";
import { RulesetBundleService } from "../../discounts/services/ruleset-bundle.service";
import { DiscountProfiler } from "../../discounts/services/discount-profiler.service";
import { PaymentsService } from "../../payments/payments.service";
import { PricingHotReloadWatcher } from "../../pricing/services/pricing-hot-reload-watcher.service";
import { PriceListService } from "../../pricing/services/price-list.service";
import { CustomerGroupService } from "../../pricing/services/customer-group.service";
import { PricingSnapshotValidator } from "../../pricing/services/pricing-snapshot-validator.service";
import { PricingAuditService } from "../../pricing/services/pricing-audit.service";
import { PricingDriftDetectorService } from "../../pricing/services/pricing-drift-detector.service";
import { BundleEligibilityService } from "../../bundles/services/bundle-eligibility.service";
import { BundlePricingService } from "../../pricing/services/bundle-pricing.service";
import { CheckoutState } from "../../redis-store/constants/checkout-states";
import { CheckoutStore } from "../../redis-store/stores/checkout-store";
import { InventoryStore } from "../../redis-store/stores/inventory-store";
import { IdempotencyStore } from "../../redis-store/stores/idempotency-store";
import { CreateOrderDto } from "../dto/create-order.dto";
import { OrdersService } from "../orders.service";
import { OrderValidationService } from "../services/order-validation.service";
import { OrderPricingService } from "../services/order-pricing.service";
import { OrderStatusService } from "../services/order-status.service";
import { OrderGstService } from "../services/order-gst.service";
import { OrderTimelineService } from "../services/order-timeline.service";
import { db, cartItems, inArray } from "@vcecom/db";

// Mock dependencies
jest.mock("@vcecom/db", () => {
  const createFromResult = () => ({
    where: jest.fn(() => Promise.resolve([])),
    innerJoin: jest.fn(() => ({
      innerJoin: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve([])),
      })),
      where: jest.fn(() => Promise.resolve([])),
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
    addresses: {},
    cartItems: {},
    carts: {},
    customers: {},
    orderItems: {},
    orders: {},
    products: {},
    productVariants: {},
  };
});

describe("OrdersService - Guest Checkout", () => {
  let service: OrdersService;
  let customersService: CustomersService;
  let addressesService: AddressesService;
  let cartsService: CartsService;
  let checkoutStore: CheckoutStore;

  const mockSessionId = "session-123";
  const mockCustomerId = "customer-123";
  const mockUserId = "user-123";
  const mockCartId = "cart-123";
  const mockCheckoutSessionId = "checkout-session-123";
  const mockShippingAddressId = "shipping-address-123";
  const mockBillingAddressId = "billing-address-123";

  const mockGuestCustomer = {
    id: mockCustomerId,
    userId: mockUserId,
    email: "guest@example.com",
    phone: "+919876543210",
    name: "Guest User",
    isGuest: true,
    emailVerified: false,
  };

  const mockGuestCart = {
    id: mockCartId,
    customerId: null,
    sessionId: mockSessionId,
    items: [
      {
        id: "cart-item-1",
        productVariantId: "variant-1",
        quantity: 2,
        price: 100,
        metadata: null,
      },
    ],
    subtotal: 200,
    total: 200,
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

  const mockAddress = {
    id: mockShippingAddressId,
    customerId: mockCustomerId,
    type: "shipping",
    street: "123 Main St",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    district: "Mumbai",
    country: "India",
    isDefault: false,
  };

  beforeEach(async () => {
    const mockCartsService = {
      getCart: jest.fn(),
      getCartById: jest.fn(),
    };

    const mockCustomersService = {
      createGuestCustomer: jest.fn(),
    };

    const mockAddressesService = {
      createByCustomerId: jest.fn(),
    };

    const mockCheckoutStore = {
      createSession: jest.fn(),
      acquireCheckoutLock: jest.fn(),
      releaseCheckoutLock: jest.fn(),
      transitionState: jest.fn(),
      storeCheckoutMetadata: jest.fn(),
      failSession: jest.fn(),
      getSession: jest.fn(),
      getCheckoutMetadata: jest.fn(),
    };

    const mockInventoryStore = {
      reserveInventory: jest.fn(),
      releaseCartReservations: jest.fn(),
    };

    const mockDiscountsService = {
      getActiveDiscounts: jest.fn().mockResolvedValue([]),
    };

    const mockPaymentsService = {
      createPaymentIntent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        CartsService,
        CustomersService,
        AddressesService,
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
        OrderValidationService,
        OrderPricingService,
        OrderGstService,
        OrderStatusService,
        OrderTimelineService,
        ...getCommonTestProviders(),
      ],
    })
      .overrideProvider(CartsService)
      .useValue(mockCartsService)
      .overrideProvider(CustomersService)
      .useValue(mockCustomersService)
      .overrideProvider(AddressesService)
      .useValue(mockAddressesService)
      .overrideProvider(CheckoutStore)
      .useValue(mockCheckoutStore)
      .overrideProvider(InventoryStore)
      .useValue(mockInventoryStore)
      .overrideProvider(DiscountsService)
      .useValue(mockDiscountsService)
      .overrideProvider(PaymentsService)
      .useValue(mockPaymentsService)
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
        detectOrderDrift: jest.fn(),
      })
      .overrideProvider(HotReloadWatcher)
      .useValue({
        watch: jest.fn(),
        unwatch: jest.fn(),
      })
      .overrideProvider(RulesetBundleService)
      .useValue({
        getRulesetBundle: jest.fn(),
      })
      .overrideProvider(DiscountProfiler)
      .useValue({
        start: jest.fn(),
        end: jest.fn(),
      })
      .overrideProvider(PricingHotReloadWatcher)
      .useValue({
        watch: jest.fn(),
        unwatch: jest.fn(),
      })
      .overrideProvider(PriceListService)
      .useValue({
        getPriceListsForCustomer: jest.fn(),
      })
      .overrideProvider(CustomerGroupService)
      .useValue({
        getCustomerGroup: jest.fn(),
      })
      .overrideProvider(PricingSnapshotValidator)
      .useValue({
        validateSnapshot: jest.fn(),
      })
      .overrideProvider(PricingAuditService)
      .useValue({
        logEvent: jest.fn(),
        logEngineRun: jest.fn(),
        logSnapshotCreated: jest.fn(),
        logSnapshotUsed: jest.fn(),
        logDrift: jest.fn(),
      })
      .overrideProvider(PricingDriftDetectorService)
      .useValue({
        detectPaymentIntentDrift: jest.fn(),
        detectOrderDrift: jest.fn(),
      })
      .overrideProvider(BundleEligibilityService)
      .useValue({
        getBundle: jest.fn(),
        validateUserSelection: jest.fn(),
      })
      .overrideProvider(BundlePricingService)
      .useValue({
        calculateBundlePrice: jest.fn(),
        getBundleVariantBreakdown: jest.fn(),
      })
      .overrideProvider(IdempotencyStore)
      .useValue({
        getIdempotencyResult: jest.fn(),
        checkAndSet: jest.fn(),
        set: jest.fn(),
        deleteIdempotency: jest.fn(),
      })
      .compile();

    service = module.get<OrdersService>(OrdersService);
    customersService = module.get<CustomersService>(CustomersService);
    addressesService = module.get<AddressesService>(AddressesService);
    cartsService = module.get<CartsService>(CartsService);
    checkoutStore = module.get<CheckoutStore>(CheckoutStore);

    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set default mocks that can be overridden in individual tests
    (cartsService.getCartById as jest.Mock).mockResolvedValue(mockGuestCart);
    
    // Mock database query for cart items (default)
    // This will be called to get cart items after getCartById
    (db.select as jest.Mock).mockImplementation(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() =>
          Promise.resolve([
            {
              id: "cart-item-1",
              productVariantId: "variant-1",
              quantity: 2,
              price: 100,
              metadata: null,
            },
          ]),
        ),
        innerJoin: jest.fn(() => ({
          innerJoin: jest.fn(() => ({
            where: jest.fn(() => Promise.resolve([])),
          })),
          where: jest.fn(() => Promise.resolve([])),
        })),
      })),
    }));
  });

  describe("create - Guest Checkout", () => {
    const guestCheckoutDto: CreateOrderDto = {
      email: "guest@example.com",
      name: "Guest User",
      phone: "+919876543210",
      address: {
        type: "shipping",
        street: "123 Main St",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        district: "Mumbai",
        country: "India",
      },
      shippingCost: 50,
    };

    it.skip("should create payment intent for guest checkout", async () => {
      // Mock customer creation
      (customersService.createGuestCustomer as jest.Mock).mockResolvedValue(
        mockGuestCustomer,
      );

      // Mock address creation
      (addressesService.createByCustomerId as jest.Mock)
        .mockResolvedValueOnce(mockAddress) // shipping
        .mockResolvedValueOnce({
          ...mockAddress,
          id: mockBillingAddressId,
          type: "billing",
        }); // billing

      // Mock cart retrieval
      (cartsService.getCart as jest.Mock).mockResolvedValue(mockGuestCart);
      (cartsService.getCartById as jest.Mock).mockResolvedValue(mockGuestCart);

      // Mock checkout session
      (checkoutStore.createSession as jest.Mock).mockResolvedValue({
        sessionId: mockCheckoutSessionId,
        session: {
          state: CheckoutState.CREATED,
          cartId: mockCartId,
        },
      });

      // Mock checkout lock
      (checkoutStore.acquireCheckoutLock as jest.Mock).mockResolvedValue(true);

      // Mock state transition
      (checkoutStore.transitionState as jest.Mock).mockResolvedValue(undefined);

      // Mock metadata storage
      (checkoutStore.storeCheckoutMetadata as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Mock payment intent creation
      (checkoutStore.getSession as jest.Mock).mockResolvedValue({
        state: CheckoutState.PAYMENT_PENDING,
        cartId: mockCartId,
        paymentIntentId: "pi-123",
      });

      (checkoutStore.assertStateIn as jest.Mock) = jest.fn().mockResolvedValue(
        undefined,
      );

      // Mock payment service
      const mockPaymentsService = {
        createPaymentIntent: jest.fn().mockResolvedValue({
          paymentIntentId: "pi-123",
          paymentProvider: "razorpay",
          status: "CREATED",
        }),
      };
      (service as any).paymentsService = mockPaymentsService;

      // Mock discount and pricing calculations
      (service as any).getCustomerGroupId = jest.fn().mockResolvedValue(null);
      (service as any).getPriceListsForCustomer = jest
        .fn()
        .mockResolvedValue([]);
      (service as any).calculateTotals = jest.fn().mockReturnValue({
        subtotal: 200,
        totalGst: 36,
        total: 286,
      });

      const result = await service.create(null, guestCheckoutDto, mockSessionId);

      expect(result).toBeDefined();
      expect(customersService.createGuestCustomer).toHaveBeenCalledWith(
        guestCheckoutDto.email,
        guestCheckoutDto.name,
        guestCheckoutDto.phone,
        null,
      );
      expect(addressesService.createByCustomerId).toHaveBeenCalledTimes(2);
      expect(cartsService.getCart).toHaveBeenCalledWith(null, mockSessionId);
      expect(checkoutStore.storeCheckoutMetadata).toHaveBeenCalledWith(
        mockCheckoutSessionId,
        expect.objectContaining({
          customerId: mockCustomerId,
          userId: mockUserId,
        }),
      );
    });

    it.skip("should create account if password is provided during guest checkout", async () => {
      const accountCheckoutDto: CreateOrderDto = {
        ...guestCheckoutDto,
        password: "SecurePassword123!",
      };

      const accountCustomer = {
        ...mockGuestCustomer,
        isGuest: false,
        emailVerified: true,
      };

      // Mock customer creation with password
      (customersService.createGuestCustomer as jest.Mock).mockResolvedValue(
        accountCustomer,
      );

      // Mock other dependencies
      (addressesService.createByCustomerId as jest.Mock)
        .mockResolvedValueOnce(mockAddress)
        .mockResolvedValueOnce({ ...mockAddress, id: mockBillingAddressId });

      (cartsService.getCart as jest.Mock).mockResolvedValue(mockGuestCart);
      (cartsService.getCartById as jest.Mock).mockResolvedValue(mockGuestCart);
      (checkoutStore.createSession as jest.Mock).mockResolvedValue({
        sessionId: mockCheckoutSessionId,
        session: { state: CheckoutState.CREATED, cartId: mockCartId },
      });
      (checkoutStore.acquireCheckoutLock as jest.Mock).mockResolvedValue(true);
      (checkoutStore.transitionState as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.storeCheckoutMetadata as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Mock payment intent
      const mockPaymentsService = {
        createPaymentIntent: jest.fn().mockResolvedValue({
          paymentIntentId: "pi-123",
          paymentProvider: "razorpay",
          status: "CREATED",
        }),
      };
      (service as any).paymentsService = mockPaymentsService;
      (service as any).getCustomerGroupId = jest.fn().mockResolvedValue(null);
      (service as any).getPriceListsForCustomer = jest
        .fn()
        .mockResolvedValue([]);
      (service as any).calculateTotals = jest.fn().mockReturnValue({
        subtotal: 200,
        totalGst: 36,
        total: 286,
      });

      // Mock database query for cart items
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn(() => ({
          where: jest.fn(() =>
            Promise.resolve([
              {
                id: "cart-item-1",
                productVariantId: "variant-1",
                quantity: 2,
                price: 100,
                metadata: null,
              },
            ]),
          ),
        })),
      });

      await service.create(null, accountCheckoutDto, mockSessionId);

      expect(customersService.createGuestCustomer).toHaveBeenCalledWith(
        accountCheckoutDto.email,
        accountCheckoutDto.name,
        accountCheckoutDto.phone,
        accountCheckoutDto.password,
      );
    });

    it("should throw error if required fields are missing for guest checkout", async () => {
      const incompleteDto: CreateOrderDto = {
        email: "guest@example.com",
        // Missing name, phone, address
      };

      await expect(
        service.create(null, incompleteDto, mockSessionId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(null, incompleteDto, mockSessionId),
      ).rejects.toThrow(
        "Email, name, phone, and address are required for guest checkout",
      );
    });

    it("should throw error if sessionId is missing for guest checkout", async () => {
      // SessionId validation happens before customer creation, so no mocks needed
      await expect(
        service.create(null, guestCheckoutDto, null),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(null, guestCheckoutDto, null),
      ).rejects.toThrow("Session ID is required for guest checkout");
    });

    it.skip("should throw error if cart is empty", async () => {
      // Reset mocks for this test
      jest.clearAllMocks();
      
      (customersService.createGuestCustomer as jest.Mock).mockResolvedValue(
        mockGuestCustomer,
      );
      (addressesService.createByCustomerId as jest.Mock)
        .mockResolvedValueOnce(mockAddress)
        .mockResolvedValueOnce({ ...mockAddress, id: mockBillingAddressId });

      (cartsService.getCart as jest.Mock).mockResolvedValue({
        ...mockGuestCart,
        items: [],
      });
      (cartsService.getCartById as jest.Mock).mockResolvedValue({
        ...mockGuestCart,
        items: [],
      });

      await expect(
        service.create(null, guestCheckoutDto, mockSessionId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(null, guestCheckoutDto, mockSessionId),
      ).rejects.toThrow("Cart is empty");
    });

    it.skip("should use existing guest customer if email already exists", async () => {
      // Mock: customer already exists as guest
      (customersService.createGuestCustomer as jest.Mock).mockResolvedValue(
        mockGuestCustomer,
      );

      (addressesService.createByCustomerId as jest.Mock)
        .mockResolvedValueOnce(mockAddress)
        .mockResolvedValueOnce({ ...mockAddress, id: mockBillingAddressId });

      (cartsService.getCart as jest.Mock).mockResolvedValue(mockGuestCart);
      (cartsService.getCartById as jest.Mock).mockResolvedValue(mockGuestCart);
      (checkoutStore.createSession as jest.Mock).mockResolvedValue({
        sessionId: mockCheckoutSessionId,
        session: { state: CheckoutState.CREATED, cartId: mockCartId },
      });
      (checkoutStore.acquireCheckoutLock as jest.Mock).mockResolvedValue(true);
      (checkoutStore.transitionState as jest.Mock).mockResolvedValue(undefined);
      (checkoutStore.storeCheckoutMetadata as jest.Mock).mockResolvedValue(
        undefined,
      );

      const mockPaymentsService = {
        createPaymentIntent: jest.fn().mockResolvedValue({
          paymentIntentId: "pi-123",
          paymentProvider: "razorpay",
          status: "CREATED",
        }),
      };
      (service as any).paymentsService = mockPaymentsService;
      (service as any).getCustomerGroupId = jest.fn().mockResolvedValue(null);
      (service as any).getPriceListsForCustomer = jest
        .fn()
        .mockResolvedValue([]);
      (service as any).calculateTotals = jest.fn().mockReturnValue({
        subtotal: 200,
        totalGst: 36,
        total: 286,
      });

      await service.create(null, guestCheckoutDto, mockSessionId);

      // Should still call createGuestCustomer, which will return existing guest
      expect(customersService.createGuestCustomer).toHaveBeenCalled();
    });
  });
});

