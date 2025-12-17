import {
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { db, eq, orders, orderItems } from "@vcecom/db";
import { CheckoutState } from "../redis-store/constants/checkout-states";
import {
  PaymentIntent,
  PaymentIntentStatus,
} from "../redis-store/dto/payment-intent.dto";
import { CheckoutStore } from "../redis-store/stores/checkout-store";
import { OrdersService } from "./orders.service";
import { ReconciliationService } from "./reconciliation.service";

// Mock database
jest.mock("@vcecom/db", () => ({
  db: {
    select: jest.fn(),
  },
  eq: jest.fn(),
  orders: {},
  orderItems: {},
}));

describe("ReconciliationService", () => {
  let service: ReconciliationService;
  let mockCheckoutStore: jest.Mocked<CheckoutStore>;
  let mockOrdersService: jest.Mocked<OrdersService>;

  const paymentIntentId = "order_razorpay_123";
  const checkoutSessionId = "cs-123";
  const orderId = "order-123";
  const provider = "razorpay";

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReconciliationService,
        {
          provide: CheckoutStore,
          useValue: {
            getOrderByPaymentIntent: jest.fn(),
            getSession: jest.fn(),
            getPaymentIntent: jest.fn(),
            getPaymentIntentByPaymentId: jest.fn(),
            get: jest.fn(),
            transitionState: jest.fn(),
            updatePaymentIntentStatus: jest.fn(),
          },
        },
        {
          provide: OrdersService,
          useValue: {
            finalizeOrderFromPayment: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReconciliationService>(ReconciliationService);
    mockCheckoutStore = module.get<CheckoutStore>(CheckoutStore);
    mockOrdersService = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("reprocessPaymentIntent", () => {
    const mockSession = {
      sessionId: checkoutSessionId,
      cartId: "cart-123",
      state: CheckoutState.PAYMENT_CONFIRMED,
      paymentIntentId,
      orderId: null,
      updatedAt: new Date().toISOString(),
    };

    const mockPaymentIntent: PaymentIntent = {
      paymentProvider: "razorpay",
      paymentIntentId,
      status: PaymentIntentStatus.CONFIRMED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it("should return existing order if already created (idempotent)", async () => {
      mockCheckoutStore.getOrderByPaymentIntent.mockResolvedValue(orderId);

      const mockOrder = {
        id: orderId,
        customerId: "customer-123",
        orderNumber: "ORD-2025-000001",
        status: "pending",
        subtotal: 1000,
        gstAmount: 180,
        shippingCost: 50,
        total: 1230,
        razorpayOrderId: paymentIntentId,
        shippingAddressId: "addr-123",
        billingAddressId: "addr-456",
        discountCode: null,
        discountAmount: 0,
        shippingProvider: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOrderItems = [
        {
          id: "order-item-123",
          orderId,
          productVariantId: "variant-123",
          quantity: 2,
          price: 500,
          gstRate: 18,
          gstAmount: 180,
        },
      ];

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

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockOrderItemsChain);

      const result = await service.reprocessPaymentIntent(
        paymentIntentId,
        provider,
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe(orderId);
      expect(mockCheckoutStore.getOrderByPaymentIntent).toHaveBeenCalledWith(
        provider,
        paymentIntentId,
      );
      // Should not create new order
      expect(mockOrdersService.finalizeOrderFromPayment).not.toHaveBeenCalled();
    });

    it("should create order if payment is confirmed and order doesn't exist", async () => {
      mockCheckoutStore.getOrderByPaymentIntent.mockResolvedValue(null);
      mockCheckoutStore.get.mockResolvedValue(checkoutSessionId);
      mockCheckoutStore.getSession.mockResolvedValue(mockSession);
      mockCheckoutStore.getPaymentIntentByPaymentId.mockResolvedValue(
        mockPaymentIntent,
      );
      mockCheckoutStore.getPaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockCheckoutStore.updatePaymentIntentStatus.mockResolvedValue(undefined);
      mockCheckoutStore.transitionState.mockResolvedValue(undefined);

      const mockOrder = {
        id: orderId,
        customerId: "customer-123",
        orderNumber: "ORD-2025-000001",
        status: "pending",
        subtotal: 1000,
        gstAmount: 180,
        shippingCost: 50,
        total: 1230,
        razorpayOrderId: paymentIntentId,
        shippingAddressId: "addr-123",
        billingAddressId: "addr-456",
        discountCode: null,
        discountAmount: 0,
        items: [],
        gstBreakdown: {
          cgst: 90,
          sgst: 90,
          igst: 0,
          totalGst: 180,
          isIntraState: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrdersService.finalizeOrderFromPayment.mockResolvedValue(
        mockOrder as any,
      );

      const result = await service.reprocessPaymentIntent(
        paymentIntentId,
        provider,
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe(orderId);
      expect(mockOrdersService.finalizeOrderFromPayment).toHaveBeenCalledWith(
        checkoutSessionId,
        paymentIntentId,
        provider,
      );
    });

    it("should throw NotFoundException if checkout session not found", async () => {
      mockCheckoutStore.getOrderByPaymentIntent.mockResolvedValue(null);
      mockCheckoutStore.get.mockResolvedValue(null);

      await expect(
        service.reprocessPaymentIntent(paymentIntentId, provider),
      ).rejects.toThrow(NotFoundException);
    });

    it("should return null if payment is not confirmed", async () => {
      mockCheckoutStore.getOrderByPaymentIntent.mockResolvedValue(null);
      mockCheckoutStore.get.mockResolvedValue(checkoutSessionId);
      mockCheckoutStore.getSession.mockResolvedValue(mockSession);
      mockCheckoutStore.getPaymentIntentByPaymentId.mockResolvedValue({
        ...mockPaymentIntent,
        status: PaymentIntentStatus.CREATED,
      });
      mockCheckoutStore.getPaymentIntent.mockResolvedValue({
        ...mockPaymentIntent,
        status: PaymentIntentStatus.CREATED,
      });

      const result = await service.reprocessPaymentIntent(
        paymentIntentId,
        provider,
      );

      expect(result).toBeNull();
      expect(mockOrdersService.finalizeOrderFromPayment).not.toHaveBeenCalled();
    });

    it("should throw error if checkout is COMPLETED but order not found", async () => {
      mockCheckoutStore.getOrderByPaymentIntent.mockResolvedValue(null);
      mockCheckoutStore.get.mockResolvedValue(checkoutSessionId);
      mockCheckoutStore.getSession.mockResolvedValue({
        ...mockSession,
        state: CheckoutState.COMPLETED,
      });
      mockCheckoutStore.getPaymentIntentByPaymentId.mockResolvedValue(
        mockPaymentIntent,
      );
      mockCheckoutStore.getPaymentIntent.mockResolvedValue(mockPaymentIntent);

      await expect(
        service.reprocessPaymentIntent(paymentIntentId, provider),
      ).rejects.toThrow(BadRequestException);
    });

    it("should transition state from PAYMENT_PENDING to PAYMENT_CONFIRMED if needed", async () => {
      mockCheckoutStore.getOrderByPaymentIntent.mockResolvedValue(null);
      mockCheckoutStore.get.mockResolvedValue(checkoutSessionId);
      mockCheckoutStore.getSession.mockResolvedValue({
        ...mockSession,
        state: CheckoutState.PAYMENT_PENDING,
      });
      mockCheckoutStore.getPaymentIntentByPaymentId.mockResolvedValue(
        mockPaymentIntent,
      );
      mockCheckoutStore.getPaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockCheckoutStore.updatePaymentIntentStatus.mockResolvedValue(undefined);
      mockCheckoutStore.transitionState.mockResolvedValue(undefined);

      const mockOrder = {
        id: orderId,
        customerId: "customer-123",
        orderNumber: "ORD-2025-000001",
        status: "pending",
        subtotal: 1000,
        gstAmount: 180,
        shippingCost: 50,
        total: 1230,
        razorpayOrderId: paymentIntentId,
        shippingAddressId: "addr-123",
        billingAddressId: "addr-456",
        discountCode: null,
        discountAmount: 0,
        items: [],
        gstBreakdown: {
          cgst: 90,
          sgst: 90,
          igst: 0,
          totalGst: 180,
          isIntraState: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrdersService.finalizeOrderFromPayment.mockResolvedValue(
        mockOrder as any,
      );

      await service.reprocessPaymentIntent(paymentIntentId, provider);

      expect(mockCheckoutStore.transitionState).toHaveBeenCalledWith(
        checkoutSessionId,
        CheckoutState.PAYMENT_PENDING,
        CheckoutState.PAYMENT_CONFIRMED,
      );
    });
  });
});

