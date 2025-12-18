import { BadRequestException, ConflictException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import { getCommonTestProviders } from "../../../common/testing/test-helpers";
import { AddressesService } from "../../customers/addresses.service";
import { CustomersService } from "../../customers/customers.service";
import { CartsService } from "../../carts/carts.service";
import { DiscountsService } from "../../discounts/discounts.service";
import { PaymentsService } from "../../payments/payments.service";
import { CheckoutState } from "../../redis-store/constants/checkout-states";
import { CheckoutStore } from "../../redis-store/stores/checkout-store";
import { InventoryStore } from "../../redis-store/stores/inventory-store";
import { CreateOrderDto } from "../../dto/create-order.dto";
import { OrdersService } from "../../orders.service";

// Mock dependencies
jest.mock("@vcecom/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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
}));

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
        {
          provide: CartsService,
          useValue: mockCartsService,
        },
        {
          provide: CustomersService,
          useValue: mockCustomersService,
        },
        {
          provide: AddressesService,
          useValue: mockAddressesService,
        },
        {
          provide: CheckoutStore,
          useValue: mockCheckoutStore,
        },
        {
          provide: InventoryStore,
          useValue: mockInventoryStore,
        },
        {
          provide: DiscountsService,
          useValue: mockDiscountsService,
        },
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
        ...getCommonTestProviders(),
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    customersService = module.get<CustomersService>(CustomersService);
    addressesService = module.get<AddressesService>(AddressesService);
    cartsService = module.get<CartsService>(CartsService);
    checkoutStore = module.get<CheckoutStore>(CheckoutStore);

    jest.clearAllMocks();
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

    it("should create payment intent for guest checkout", async () => {
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

    it("should create account if password is provided during guest checkout", async () => {
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
      await expect(
        service.create(null, guestCheckoutDto, null),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(null, guestCheckoutDto, null),
      ).rejects.toThrow("Session ID is required for guest checkout");
    });

    it("should throw error if cart is empty", async () => {
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

      await expect(
        service.create(null, guestCheckoutDto, mockSessionId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(null, guestCheckoutDto, mockSessionId),
      ).rejects.toThrow("Cart is empty");
    });

    it("should use existing guest customer if email already exists", async () => {
      // Mock: customer already exists as guest
      (customersService.createGuestCustomer as jest.Mock).mockResolvedValue(
        mockGuestCustomer,
      );

      (addressesService.createByCustomerId as jest.Mock)
        .mockResolvedValueOnce(mockAddress)
        .mockResolvedValueOnce({ ...mockAddress, id: mockBillingAddressId });

      (cartsService.getCart as jest.Mock).mockResolvedValue(mockGuestCart);
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

