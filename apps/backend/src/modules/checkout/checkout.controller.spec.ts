import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { CheckoutController } from "./checkout.controller";
import { PaymentChargeService } from "../payments/services/payment-charge.service";
import { CartsService } from "../carts/carts.service";
import { CheckoutStore } from "../redis-store/stores/checkout-store";
import { ContextService } from "../../common/logging/context.service";
import { getCommonTestProviders } from "../../common/testing/test-helpers";
import { PaymentMethod } from "@vcecom/db";
import { CheckoutService } from "./checkout.service";

describe("CheckoutController", () => {
  let controller: CheckoutController;
  let paymentChargeService: jest.Mocked<PaymentChargeService>;
  let cartsService: jest.Mocked<CartsService>;
  let checkoutStore: jest.Mocked<CheckoutStore>;

  const mockSessionId = "session-123";
  const mockCartId = "cart-123";
  const mockUserId = "user-123";

  const mockCart = {
    id: mockCartId,
    customerId: "customer-123",
    sessionId: mockSessionId,
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
    sessionId: mockSessionId,
    state: "payment_pending",
    cartId: mockCartId,
    paymentIntentId: "pi-123",
  };

  const mockCheckoutMetadata = {
    shippingAddressId: "address-1",
    billingAddressId: "address-2",
    paymentMethod: null,
    paymentFee: 0,
    paymentFeeBreakdown: null,
    discountSnapshot: null,
    pricingSnapshot: null,
  };

  beforeEach(async () => {
    const mockPaymentChargeService = {
      getAvailableMethods: jest.fn(),
      calculateFee: jest.fn(),
    };

    const mockCartsService = {
      getCart: jest.fn(),
      getCartById: jest.fn(),
    };

    const mockCheckoutStore = {
      getSession: jest.fn(),
      getCheckoutMetadata: jest.fn(),
      storeCheckoutMetadata: jest.fn(),
    };

    const mockCheckoutService = {
      startCheckout: jest.fn(),
      applyAddress: jest.fn(),
      selectShipping: jest.fn(),
      confirmCheckout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CheckoutController],
      providers: [
        {
          provide: PaymentChargeService,
          useValue: mockPaymentChargeService,
        },
        {
          provide: CartsService,
          useValue: mockCartsService,
        },
        {
          provide: CheckoutStore,
          useValue: mockCheckoutStore,
        },
        {
          provide: CheckoutService,
          useValue: mockCheckoutService,
        },
        ...getCommonTestProviders(),
      ],
    }).compile();

    controller = module.get<CheckoutController>(CheckoutController);
    paymentChargeService = module.get(PaymentChargeService);
    cartsService = module.get(CartsService);
    checkoutStore = module.get(CheckoutStore);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getPaymentMethods", () => {
    it("should return payment methods with calculated fees for authenticated user", async () => {
      const mockMethods = [
        {
          method: PaymentMethod.COD,
          label: "Cash on Delivery",
          fee: 3000,
          breakdown: {
            method: PaymentMethod.COD,
            chargeType: "FLAT",
            flatAmount: 3000,
            calculatedFee: 3000,
          },
          available: true,
          unavailableReason: undefined,
        },
        {
          method: PaymentMethod.RAZORPAY_CARD,
          label: "Card (Razorpay)",
          fee: 2000,
          breakdown: {
            method: PaymentMethod.RAZORPAY_CARD,
            chargeType: "PERCENTAGE",
            percentage: 2.0,
            calculatedFee: 2000,
          },
          available: true,
          unavailableReason: undefined,
        },
        {
          method: PaymentMethod.RAZORPAY_UPI,
          label: "UPI",
          fee: 0,
          breakdown: {
            method: PaymentMethod.RAZORPAY_UPI,
            chargeType: "PERCENTAGE",
            percentage: 0,
            calculatedFee: 0,
          },
          available: true,
          unavailableReason: undefined,
        },
      ];

      cartsService.getCart.mockResolvedValue(mockCart);
      paymentChargeService.getAvailableMethods.mockResolvedValue(mockMethods);

      const req = {
        user: { userId: mockUserId },
      } as any;

      const result = await controller.getPaymentMethods(req);

      expect(result).toEqual({ methods: mockMethods });
      expect(cartsService.getCart).toHaveBeenCalledWith(mockUserId, null);
      expect(paymentChargeService.getAvailableMethods).toHaveBeenCalledWith(
        100000, // cart total in paise
        "INR",
        expect.any(Array),
        expect.any(Object), // context parameter
      );
    });

    it("should return payment methods with calculated fees for guest user", async () => {
      const mockMethods = [
        {
          method: PaymentMethod.COD,
          label: "Cash on Delivery",
          fee: 3000,
          breakdown: {
            method: PaymentMethod.COD,
            chargeType: "FLAT",
            flatAmount: 3000,
            calculatedFee: 3000,
          },
          available: true,
          unavailableReason: undefined,
        },
      ];

      cartsService.getCart.mockResolvedValue(mockCart);
      paymentChargeService.getAvailableMethods.mockResolvedValue(mockMethods);

      const req = {
        headers: {
          "x-session-id": mockSessionId,
        },
      } as any;

      const result = await controller.getPaymentMethods(req);

      expect(result).toEqual({ methods: mockMethods });
      expect(cartsService.getCart).toHaveBeenCalledWith(null, mockSessionId);
    });

    it("should return empty methods when cart is empty", async () => {
      cartsService.getCart.mockResolvedValue({
        ...mockCart,
        items: [],
        total: 0,
      });

      const req = {
        user: { userId: mockUserId },
      } as any;

      const result = await controller.getPaymentMethods(req);

      expect(result).toEqual({ methods: [] });
      expect(paymentChargeService.getAvailableMethods).not.toHaveBeenCalled();
    });

    it("should return empty methods when cart is null", async () => {
      cartsService.getCart.mockResolvedValue(null);

      const req = {
        user: { userId: mockUserId },
      } as any;

      const result = await controller.getPaymentMethods(req);

      expect(result).toEqual({ methods: [] });
      expect(paymentChargeService.getAvailableMethods).not.toHaveBeenCalled();
    });
  });

  describe("selectPaymentMethod", () => {
    it("should select payment method and store fee in checkout session", async () => {
      const paymentMethod = PaymentMethod.COD;
      const calculatedFee = 3000;
      const breakdown = {
        method: PaymentMethod.COD,
        chargeType: "FLAT",
        flatAmount: 3000,
        calculatedFee: 3000,
      };

      cartsService.getCart.mockResolvedValue(mockCart);
      paymentChargeService.calculateFee.mockResolvedValue({
        fee: calculatedFee,
        breakdown,
      });
      checkoutStore.getSession.mockResolvedValue(mockCheckoutSession);
      checkoutStore.getCheckoutMetadata.mockResolvedValue(mockCheckoutMetadata);
      checkoutStore.storeCheckoutMetadata.mockResolvedValue(undefined);

      const req = {} as any;
      const result = await controller.selectPaymentMethod(req, {
        paymentMethod,
        checkoutSessionId: mockSessionId,
      });

      expect(result).toEqual({
        success: true,
        fee: calculatedFee,
        breakdown,
      });
      expect(cartsService.getCart).toHaveBeenCalledWith(null, null);
      expect(paymentChargeService.calculateFee).toHaveBeenCalledWith(
        paymentMethod,
        100000, // cart total in paise
        "INR",
      );
      expect(checkoutStore.getSession).toHaveBeenCalledWith(mockSessionId);
      expect(checkoutStore.storeCheckoutMetadata).toHaveBeenCalledWith(
        mockSessionId,
        {
          ...mockCheckoutMetadata,
          paymentMethod,
          paymentFee: calculatedFee,
          paymentFeeBreakdown: breakdown,
        },
      );
    });

    it("should throw BadRequestException when checkout session not found", async () => {
      cartsService.getCart.mockResolvedValue(mockCart);
      paymentChargeService.calculateFee.mockResolvedValue({
        fee: 0,
        breakdown: {},
      });
      checkoutStore.getSession.mockResolvedValue(null);

      const req = {} as any;
      await expect(
        controller.selectPaymentMethod(req, {
          paymentMethod: PaymentMethod.COD,
          checkoutSessionId: mockSessionId,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(checkoutStore.getSession).toHaveBeenCalledWith(mockSessionId);
    });

    it("should throw BadRequestException when cart is empty", async () => {
      cartsService.getCart.mockResolvedValue({
        ...mockCart,
        items: [],
      });

      const req = {} as any;
      await expect(
        controller.selectPaymentMethod(req, {
          paymentMethod: PaymentMethod.COD,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when cart is null", async () => {
      cartsService.getCart.mockResolvedValue(null);

      const req = {} as any;
      await expect(
        controller.selectPaymentMethod(req, {
          paymentMethod: PaymentMethod.COD,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when checkout metadata not found", async () => {
      cartsService.getCart.mockResolvedValue(mockCart);
      paymentChargeService.calculateFee.mockResolvedValue({
        fee: 0,
        breakdown: {},
      });
      checkoutStore.getSession.mockResolvedValue(mockCheckoutSession);
      checkoutStore.getCheckoutMetadata.mockResolvedValue(null);

      const req = {} as any;
      await expect(
        controller.selectPaymentMethod(req, {
          paymentMethod: PaymentMethod.COD,
          checkoutSessionId: mockSessionId,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should calculate fee correctly for different payment methods", async () => {
      const testCases = [
        {
          method: PaymentMethod.RAZORPAY_CARD,
          expectedFee: 2000, // 2% of ₹1000
          breakdown: {
            method: PaymentMethod.RAZORPAY_CARD,
            chargeType: "PERCENTAGE",
            percentage: 2.0,
            calculatedFee: 2000,
          },
        },
        {
          method: PaymentMethod.STRIPE_CARD,
          expectedFee: 3100, // 2.9% of ₹1000 + ₹2 flat
          breakdown: {
            method: PaymentMethod.STRIPE_CARD,
            chargeType: "MIXED",
            percentage: 2.9,
            flatAmount: 200,
            calculatedFee: 3100,
          },
        },
      ];

      for (const testCase of testCases) {
        cartsService.getCart.mockResolvedValue(mockCart);
        paymentChargeService.calculateFee.mockResolvedValue({
          fee: testCase.expectedFee,
          breakdown: testCase.breakdown,
        });
        checkoutStore.getSession.mockResolvedValue(mockCheckoutSession);
        checkoutStore.getCheckoutMetadata.mockResolvedValue(
          mockCheckoutMetadata,
        );
        checkoutStore.storeCheckoutMetadata.mockResolvedValue(undefined);

        const req = {} as any;
        const result = await controller.selectPaymentMethod(req, {
          paymentMethod: testCase.method,
          checkoutSessionId: mockSessionId,
        });

        expect(result.fee).toBe(testCase.expectedFee);
        expect(result.breakdown).toEqual(testCase.breakdown);
      }
    });
  });
});

