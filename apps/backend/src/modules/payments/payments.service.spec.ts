import { BadRequestException, ConflictException, NotFoundException, forwardRef } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PinoLogger } from "nestjs-pino";
import { db, eq, orders, payments } from "@vcecom/db";
import Razorpay from "razorpay";
import { ContextService } from "../../common/logging/context.service";
import { getCommonTestProviders } from "../../common/testing/test-helpers";
import { AppConfigService } from "../../common/config/app.config.service";
import { CheckoutState } from "../redis-store/constants/checkout-states";
import {
  PaymentIntent,
  PaymentIntentStatus,
} from "../redis-store/dto/payment-intent.dto";
import { CheckoutStore } from "../redis-store/stores/checkout-store";
import { OrdersService } from "../orders/orders.service";
import { PaymentsService } from "./payments.service";
import { RazorpayConfigService } from "./razorpay-config.service";
import { CreateRazorpayOrderDto } from "./dto/create-razorpay-order.dto";
import { RazorpayWebhookEventDto } from "./dto/webhook-event.dto";
import { VerifyPaymentDto } from "./dto/verify-payment.dto";

// Mock Razorpay
jest.mock("razorpay", () => {
  return jest.fn().mockImplementation(() => {
    return {
      orders: {
        create: jest.fn(),
        fetch: jest.fn(),
      },
      payments: {
        fetch: jest.fn(),
      },
    };
  });
});

// Mock database
jest.mock("@vcecom/db", () => ({
    select: jest.fn(),
    update: jest.fn(),
    insert: jest.fn(),
  },
  eq: jest.fn(),
  orders: {
    id: "id",
    razorpayOrderId: "razorpay_order_id",
    orderNumber: "order_number",
  },
  payments: {
    id: "id",
    razorpayPaymentId: "razorpay_payment_id",
    razorpayOrderId: "razorpay_order_id",
  },
}));

describe("PaymentsService", () => {
  let service: PaymentsService;
  let razorpayConfigService: RazorpayConfigService;
  let mockCheckoutStore: jest.Mocked<CheckoutStore>;
  let mockOrdersService: jest.Mocked<OrdersService>;
  let mockRazorpayInstance: any;
  let appConfigService: AppConfigService;
  let pinoLogger: PinoLogger;
  let contextService: ContextService;

  beforeEach(async () => {
    // Clear environment variables
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_WEBHOOK_SECRET;

    mockRazorpayInstance = {
      orders: {
        create: jest.fn(),
        fetch: jest.fn(),
      },
      payments: {
        fetch: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        RazorpayConfigService,
        ...getCommonTestProviders(),
        {
          provide: CheckoutStore,
          useValue: {
            getSessionByOrderId: jest.fn(),
            setPaymentIntent: jest.fn(),
            transitionState: jest.fn(),
            failSession: jest.fn(),
            assertState: jest.fn(),
            getPaymentIntent: jest.fn(),
            createOrGetPaymentIntent: jest.fn(),
            updatePaymentIntentStatus: jest.fn(),
            getPaymentIntentByPaymentId: jest.fn(),
            get: jest.fn(),
            getSession: jest.fn(),
            acquireCheckoutLock: jest.fn(),
            releaseCheckoutLock: jest.fn(),
            getOrderByPaymentIntent: jest.fn(),
          },
        },
        {
          provide: OrdersService,
          useValue: {
            finalizeOrderFromPayment: jest.fn(),
            findOne: jest.fn(), // Added for reconciliation service
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    razorpayConfigService =
      module.get<RazorpayConfigService>(RazorpayConfigService);
    mockCheckoutStore = module.get<CheckoutStore>(CheckoutStore);
    mockOrdersService = module.get<OrdersService>(OrdersService);
    appConfigService = module.get<AppConfigService>(AppConfigService);
    pinoLogger = module.get<PinoLogger>(PinoLogger);
    contextService = module.get<ContextService>(ContextService);

    // Mock initialize method
    jest
      .spyOn(razorpayConfigService, "initialize")
      .mockReturnValue(mockRazorpayInstance as unknown as Razorpay);

    // Initialize service for tests
    service.initialize("rzp_test_1234567890", "secret_1234567890");
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
  });

  describe("onModuleInit", () => {
    it("should initialize Razorpay when environment variables are set", () => {
      jest.clearAllMocks();
      process.env.RAZORPAY_KEY_ID = "rzp_test_1234567890";
      process.env.RAZORPAY_KEY_SECRET = "secret_1234567890";

    const mockOrdersService = {
      finalizeOrderFromPayment: jest.fn(),
    };
    const newService = new PaymentsService(
      razorpayConfigService,
      mockCheckoutStore,
      mockOrdersService as any,
      pinoLogger,
      contextService,
      appConfigService,
    );
      newService.onModuleInit();

      expect(razorpayConfigService.initialize).toHaveBeenCalledWith({
        keyId: "rzp_test_1234567890",
        keySecret: "secret_1234567890",
      });
    });

    it("should not initialize Razorpay when keyId is missing", () => {
      jest.clearAllMocks();
      delete process.env.RAZORPAY_KEY_ID;
      process.env.RAZORPAY_KEY_SECRET = "secret_1234567890";

    const mockOrdersService = {
      finalizeOrderFromPayment: jest.fn(),
    };
    const newService = new PaymentsService(
      razorpayConfigService,
      mockCheckoutStore,
      mockOrdersService as any,
      pinoLogger,
      contextService,
      appConfigService,
    );
      newService.onModuleInit();

      expect(razorpayConfigService.initialize).not.toHaveBeenCalled();
    });

    it("should not initialize Razorpay when keySecret is missing", () => {
      jest.clearAllMocks();
      process.env.RAZORPAY_KEY_ID = "rzp_test_1234567890";
      delete process.env.RAZORPAY_KEY_SECRET;

    const mockOrdersService = {
      finalizeOrderFromPayment: jest.fn(),
    };
    const newService = new PaymentsService(
      razorpayConfigService,
      mockCheckoutStore,
      mockOrdersService as any,
      pinoLogger,
      contextService,
      appConfigService,
    );
      newService.onModuleInit();

      expect(razorpayConfigService.initialize).not.toHaveBeenCalled();
    });
  });

  describe("getRazorpayInstance", () => {
    it("should return Razorpay instance when initialized", () => {
      const instance = service.getRazorpayInstance();

      expect(instance).toBeDefined();
      expect(instance).toBe(mockRazorpayInstance);
    });

    it("should throw error when Razorpay is not initialized", () => {
    const mockOrdersService = {
      finalizeOrderFromPayment: jest.fn(),
    };
    const newService = new PaymentsService(
      razorpayConfigService,
      mockCheckoutStore,
      mockOrdersService as any,
    );
      expect(() => newService.getRazorpayInstance()).toThrow(
        "Razorpay is not initialized. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.",
      );
    });
  });

  describe("isInitialized", () => {
    it("should return false when not initialized", () => {
    const mockOrdersService = {
      finalizeOrderFromPayment: jest.fn(),
    };
    const newService = new PaymentsService(
      razorpayConfigService,
      mockCheckoutStore,
      mockOrdersService as any,
    );
      expect(newService.isInitialized()).toBe(false);
    });

    it("should return true after initialization", () => {
      expect(service.isInitialized()).toBe(true);
    });
  });

  describe("initialize", () => {
    it("should initialize Razorpay with provided credentials", () => {
    const mockOrdersService = {
      finalizeOrderFromPayment: jest.fn(),
    };
    const newService = new PaymentsService(
      razorpayConfigService,
      mockCheckoutStore,
      mockOrdersService as any,
    );
      newService.initialize("rzp_test_1234567890", "secret_1234567890");

      expect(razorpayConfigService.initialize).toHaveBeenCalledWith({
        keyId: "rzp_test_1234567890",
        keySecret: "secret_1234567890",
      });
      expect(newService.isInitialized()).toBe(true);
    });
  });

  describe("createRazorpayOrder", () => {
    const orderId = "123e4567-e89b-12d3-a456-426614174000";
    const createDto: CreateRazorpayOrderDto = {
      orderId,
      amount: 100000, // ₹1000 in paise
      currency: "INR",
      receipt: "receipt_123",
      paymentCapture: 1,
    };

    const mockOrder = {
      id: orderId,
      orderNumber: "ORD-2025-001234",
      razorpayOrderId: null,
    };

    const mockRazorpayOrder = {
      id: "order_MNOPQRSTUVWXYZ",
      entity: "order",
      amount: 100000,
      amount_paid: 0,
      amount_due: 100000,
      currency: "INR",
      receipt: "receipt_123",
      status: "created",
      attempts: 0,
      notes: { order_id: orderId, order_number: "ORD-2025-001234" },
      created_at: 1234567890,
    };

    it("should create Razorpay order successfully", async () => {
      const selectMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      });

      const updateMock = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      (db.select as jest.Mock) = selectMock;
      (db.update as jest.Mock) = updateMock;
      mockRazorpayInstance.orders.create.mockResolvedValue(mockRazorpayOrder);

      const result = await service.createRazorpayOrder(createDto);

      expect(result).toEqual(mockRazorpayOrder);
      expect(mockRazorpayInstance.orders.create).toHaveBeenCalledWith({
        amount: 100000,
        currency: "INR",
        receipt: "receipt_123",
        payment_capture: 1,
        notes: {
          order_id: orderId,
          order_number: "ORD-2025-001234",
        },
      });
    });

    it("should throw NotFoundException when order does not exist", async () => {
      const selectMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      (db.select as jest.Mock) = selectMock;

      await expect(service.createRazorpayOrder(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException when order already has Razorpay order ID", async () => {
      const orderWithRazorpayId = {
        ...mockOrder,
        razorpayOrderId: "order_EXISTING",
      };

      const selectMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([orderWithRazorpayId]),
          }),
        }),
      });

      (db.select as jest.Mock) = selectMock;

      await expect(service.createRazorpayOrder(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should use default values when optional fields are not provided", async () => {
      const createDtoMinimal: CreateRazorpayOrderDto = {
        orderId,
        amount: 100000,
      };

      const selectMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      });

      const updateMock = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      (db.select as jest.Mock) = selectMock;
      (db.update as jest.Mock) = updateMock;
      mockRazorpayInstance.orders.create.mockResolvedValue(mockRazorpayOrder);

      await service.createRazorpayOrder(createDtoMinimal);

      expect(mockRazorpayInstance.orders.create).toHaveBeenCalledWith({
        amount: 100000,
        currency: "INR",
        receipt: "ORD-2025-001234",
        payment_capture: 1,
        notes: {
          order_id: orderId,
          order_number: "ORD-2025-001234",
        },
      });
    });
  });

  describe("verifyPayment", () => {
    const verifyDto: VerifyPaymentDto = {
      razorpay_order_id: "order_MNOPQRSTUVWXYZ",
      razorpay_payment_id: "pay_MNOPQRSTUVWXYZ",
      razorpay_signature: "abc123def456",
    };

    beforeEach(() => {
      process.env.RAZORPAY_KEY_SECRET = "secret_1234567890";
    });

    it("should verify payment signature successfully", async () => {
      // Mock crypto.createHmac to return a mock that produces a known signature
      const crypto = require("crypto");
      const originalCreateHmac = crypto.createHmac;
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue("abc123def456"),
      };
      jest.spyOn(crypto, "createHmac").mockReturnValue(mockHmac);

      const result = await service.verifyPayment(verifyDto);

      expect(result.verified).toBe(true);
      expect(result.message).toBe("Payment signature verified successfully");
    });

    it("should fail verification when signature does not match", async () => {
      const crypto = require("crypto");
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue("different_signature"),
      };
      jest.spyOn(crypto, "createHmac").mockReturnValue(mockHmac);

      const result = await service.verifyPayment(verifyDto);

      expect(result.verified).toBe(false);
      expect(result.message).toBe("Payment signature verification failed");
    });

    it("should throw BadRequestException when key secret is not configured", async () => {
      delete process.env.RAZORPAY_KEY_SECRET;

      await expect(service.verifyPayment(verifyDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("getPaymentDetails", () => {
    const paymentId = "pay_MNOPQRSTUVWXYZ";
    const mockPayment = {
      id: paymentId,
      entity: "payment",
      amount: 100000,
      currency: "INR",
      status: "captured",
    };

    it("should return payment details", async () => {
      mockRazorpayInstance.payments.fetch.mockResolvedValue(mockPayment);

      const result = await service.getPaymentDetails(paymentId);

      expect(result).toEqual(mockPayment);
      expect(mockRazorpayInstance.payments.fetch).toHaveBeenCalledWith(
        paymentId,
      );
    });

    it("should throw NotFoundException when payment does not exist", async () => {
      mockRazorpayInstance.payments.fetch.mockRejectedValue(
        new Error("Payment not found"),
      );

      await expect(service.getPaymentDetails(paymentId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getRazorpayOrderDetails", () => {
    const orderId = "order_MNOPQRSTUVWXYZ";
    const mockRazorpayOrder = {
      id: orderId,
      entity: "order",
      amount: 100000,
      status: "paid",
    };

    it("should return Razorpay order details", async () => {
      mockRazorpayInstance.orders.fetch.mockResolvedValue(mockRazorpayOrder);

      const result = await service.getRazorpayOrderDetails(orderId);

      expect(result).toEqual(mockRazorpayOrder);
      expect(mockRazorpayInstance.orders.fetch).toHaveBeenCalledWith(orderId);
    });

    it("should throw NotFoundException when order does not exist", async () => {
      mockRazorpayInstance.orders.fetch.mockRejectedValue(
        new Error("Order not found"),
      );

      await expect(service.getRazorpayOrderDetails(orderId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("handleWebhook", () => {
    const webhookSecret = "webhook_secret_123";
    const signature = "valid_signature";

    beforeEach(() => {
      process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
    });

    const createWebhookEvent = (
      eventName: string,
      paymentId?: string,
      orderId?: string,
    ): RazorpayWebhookEventDto => ({
      entity: "event",
      account_id: "acc_MNOPQRSTUVWXYZ",
      event: eventName,
      contains: ["payment", "order"],
      payload: {
        payment: paymentId
          ? {
              entity: {
                id: paymentId,
                entity: "payment",
                amount: 100000,
                currency: "INR",
                status: "captured",
                order_id: orderId || "order_MNOPQRSTUVWXYZ",
                invoice_id: null,
                international: false,
                method: "card",
                amount_refunded: 0,
                refund_status: null,
                captured: true,
                description: null,
                card_id: null,
                bank: null,
                wallet: null,
                vpa: null,
                email: "test@example.com",
                contact: "+919999999999",
                notes: {},
                fee: 0,
                tax: 0,
                error_code: null,
                error_description: null,
                error_source: null,
                error_step: null,
                error_reason: null,
                acquirer_data: {},
                created_at: 1234567890,
              },
            }
          : undefined,
        order: orderId
          ? {
              entity: {
                id: orderId,
                entity: "order",
                amount: 100000,
                amount_paid: 100000,
                amount_due: 0,
                currency: "INR",
                receipt: "receipt_123",
                offer_id: null,
                status: "paid",
                attempts: 1,
                notes: {},
                created_at: 1234567890,
              },
            }
          : undefined,
      },
      created_at: 1234567890,
    });

    it("should verify webhook signature and process payment.captured event", async () => {
      const crypto = require("crypto");
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(signature),
      };
      jest.spyOn(crypto, "createHmac").mockReturnValue(mockHmac);

      const webhookEvent = createWebhookEvent(
        "payment.captured",
        "pay_MNOPQRSTUVWXYZ",
        "order_MNOPQRSTUVWXYZ",
      );

      const mockOrder = {
        id: "order-id",
        razorpayOrderId: "order_MNOPQRSTUVWXYZ",
        status: "pending",
      };

      const selectOrderMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      });

      const selectPaymentMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const insertMock = jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      const updateOrderMock = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      (db.select as jest.Mock) = jest
        .fn()
        .mockReturnValueOnce(selectOrderMock())
        .mockReturnValueOnce(selectPaymentMock());
      (db.insert as jest.Mock) = insertMock;
      (db.update as jest.Mock) = updateOrderMock;

      const result = await service.handleWebhook(webhookEvent, signature);

      expect(result.processed).toBe(true);
      expect(result.message).toBe("Event payment.captured processed successfully");
    });

    it("should throw BadRequestException when webhook secret is not configured", async () => {
      delete process.env.RAZORPAY_WEBHOOK_SECRET;

      const webhookEvent = createWebhookEvent("payment.captured");

      await expect(
        service.handleWebhook(webhookEvent, signature),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when signature is invalid", async () => {
      const crypto = require("crypto");
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue("different_signature"),
      };
      jest.spyOn(crypto, "createHmac").mockReturnValue(mockHmac);

      const webhookEvent = createWebhookEvent("payment.captured");

      await expect(
        service.handleWebhook(webhookEvent, "invalid_signature"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should handle unhandled events gracefully", async () => {
      const crypto = require("crypto");
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(signature),
      };
      jest.spyOn(crypto, "createHmac").mockReturnValue(mockHmac);

      const webhookEvent = createWebhookEvent("unknown.event");

      const result = await service.handleWebhook(webhookEvent, signature);

      expect(result.processed).toBe(false);
      expect(result.message).toBe("Event unknown.event is not handled");
    });

    it("should handle payment.failed event", async () => {
      const crypto = require("crypto");
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(signature),
      };
      jest.spyOn(crypto, "createHmac").mockReturnValue(mockHmac);

      const webhookEvent = createWebhookEvent(
        "payment.failed",
        "pay_FAILED",
        "order_MNOPQRSTUVWXYZ",
      );

      const mockOrder = {
        id: "order-id",
        razorpayOrderId: "order_MNOPQRSTUVWXYZ",
        status: "pending",
      };

      const selectOrderMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      });

      const selectPaymentMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const insertMock = jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      (db.select as jest.Mock) = jest
        .fn()
        .mockReturnValueOnce(selectOrderMock())
        .mockReturnValueOnce(selectPaymentMock());
      (db.insert as jest.Mock) = insertMock;

      const result = await service.handleWebhook(webhookEvent, signature);

      expect(result.processed).toBe(true);
      expect(result.message).toBe("Event payment.failed processed successfully");
    });

    it("should handle payment.authorized event", async () => {
      const crypto = require("crypto");
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(signature),
      };
      jest.spyOn(crypto, "createHmac").mockReturnValue(mockHmac);

      const webhookEvent = createWebhookEvent(
        "payment.authorized",
        "pay_AUTHORIZED",
        "order_MNOPQRSTUVWXYZ",
      );

      const mockOrder = {
        id: "order-id",
        razorpayOrderId: "order_MNOPQRSTUVWXYZ",
        status: "pending",
      };

      const selectOrderMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      });

      const selectPaymentMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const insertMock = jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      (db.select as jest.Mock) = jest
        .fn()
        .mockReturnValueOnce(selectOrderMock())
        .mockReturnValueOnce(selectPaymentMock());
      (db.insert as jest.Mock) = insertMock;

      const result = await service.handleWebhook(webhookEvent, signature);

      expect(result.processed).toBe(true);
      expect(result.message).toBe(
        "Event payment.authorized processed successfully",
      );
    });

    it("should handle order.paid event", async () => {
      const crypto = require("crypto");
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(signature),
      };
      jest.spyOn(crypto, "createHmac").mockReturnValue(mockHmac);

      const webhookEvent = createWebhookEvent(
        "order.paid",
        undefined,
        "order_MNOPQRSTUVWXYZ",
      );

      const mockOrder = {
        id: "order-id",
        razorpayOrderId: "order_MNOPQRSTUVWXYZ",
        status: "pending",
      };

      const selectOrderMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      });

      const updateOrderMock = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      (db.select as jest.Mock) = selectOrderMock;
      (db.update as jest.Mock) = updateOrderMock;

      const result = await service.handleWebhook(webhookEvent, signature);

      expect(result.processed).toBe(true);
      expect(result.message).toBe("Event order.paid processed successfully");
    });

    it("should handle payment.captured with existing payment", async () => {
      const crypto = require("crypto");
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(signature),
      };
      jest.spyOn(crypto, "createHmac").mockReturnValue(mockHmac);

      const webhookEvent = createWebhookEvent(
        "payment.captured",
        "pay_EXISTING",
        "order_MNOPQRSTUVWXYZ",
      );

      const mockOrder = {
        id: "order-id",
        razorpayOrderId: "order_MNOPQRSTUVWXYZ",
        status: "pending",
      };

      const mockPayment = {
        id: "payment-id",
        razorpayPaymentId: "pay_EXISTING",
      };

      const selectOrderMock = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([mockOrder]),
      };

      const selectPaymentMock = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([mockPayment]),
      };

      const updatePaymentMock = {
        set: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(undefined),
      };

      const updateOrderMock = {
        set: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(undefined),
      };

      // Mock getRazorpayOrderDetails
      jest.spyOn(service, "getRazorpayOrderDetails").mockResolvedValue({
        id: "order_MNOPQRSTUVWXYZ",
        notes: {},
      });

      (db.select as jest.Mock).mockImplementation((args) => {
        if (args === payments) {
          return selectPaymentMock;
        }
        return selectOrderMock;
      });
      (db.update as jest.Mock).mockImplementation((args) => {
        if (args === payments) {
          return updatePaymentMock;
        }
        return updateOrderMock;
      });

      const result = await service.handleWebhook(webhookEvent, signature);

      expect(result.processed).toBe(true);
    });

    it("should handle webhook when order not found", async () => {
      const crypto = require("crypto");
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(signature),
      };
      jest.spyOn(crypto, "createHmac").mockReturnValue(mockHmac);

      const webhookEvent = createWebhookEvent(
        "payment.captured",
        "pay_MNOPQRSTUVWXYZ",
        "order_NOTFOUND",
      );

      const selectOrderMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      (db.select as jest.Mock) = selectOrderMock;

      const result = await service.handleWebhook(webhookEvent, signature);

      expect(result.processed).toBe(true);
    });

    it("should handle createRazorpayOrder error", async () => {
      const createDto: CreateRazorpayOrderDto = {
        orderId: "123e4567-e89b-12d3-a456-426614174000",
        amount: 100000,
      };

      const mockOrder = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        orderNumber: "ORD-2025-001234",
        razorpayOrderId: null,
      };

      const selectMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      });

      (db.select as jest.Mock) = selectMock;
      mockRazorpayInstance.orders.create.mockRejectedValue(
        new Error("Razorpay API error"),
      );

      await expect(service.createRazorpayOrder(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("createPaymentIntent", () => {
    const checkoutSessionId = "checkout-session-123";
    const amount = 100000; // 1000 INR in paise
    const paymentIntentId = "order_123456";

    it("should create payment intent idempotently", async () => {
      const mockPaymentIntent: PaymentIntent = {
        paymentProvider: "razorpay",
        paymentIntentId,
        status: PaymentIntentStatus.CREATED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockRazorpayOrder = {
        id: paymentIntentId,
        amount: amount,
        currency: "INR",
        receipt: `checkout-${checkoutSessionId}`,
        status: "created",
        notes: {
          checkout_session_id: checkoutSessionId,
        },
      };

      mockCheckoutStore.assertState.mockResolvedValue(undefined);
      // Mock createOrGetPaymentIntent to call the provider function (simulating new creation)
      mockCheckoutStore.createOrGetPaymentIntent.mockImplementation(
        async (sessionId, createFn) => {
          // Simulate calling the provider
          const intent = await createFn();
          return intent;
        },
      );
      mockCheckoutStore.transitionState.mockResolvedValue(undefined);
      mockRazorpayInstance.orders.create.mockResolvedValue(mockRazorpayOrder);

      const result = await service.createPaymentIntent(
        checkoutSessionId,
        amount,
        "INR",
      );

      // Compare structure without exact timestamp matching (timestamps are generated dynamically)
      expect(result).toMatchObject({
        paymentProvider: mockPaymentIntent.paymentProvider,
        paymentIntentId: mockPaymentIntent.paymentIntentId,
        status: mockPaymentIntent.status,
      });
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(typeof result.createdAt).toBe("string");
      expect(typeof result.updatedAt).toBe("string");
      expect(mockCheckoutStore.assertState).toHaveBeenCalledWith(
        checkoutSessionId,
        CheckoutState.LOCKED,
      );
      expect(mockCheckoutStore.createOrGetPaymentIntent).toHaveBeenCalled();
      expect(mockRazorpayInstance.orders.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount,
          currency: "INR",
          receipt: expect.any(String),
          payment_capture: 1,
          notes: expect.objectContaining({
            checkout_session_id: checkoutSessionId,
          }),
        }),
      );
    });

    it("should return existing payment intent on retry (idempotent)", async () => {
      const mockPaymentIntent: PaymentIntent = {
        paymentProvider: "razorpay",
        paymentIntentId,
        status: PaymentIntentStatus.CREATED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // createOrGetPaymentIntent returns existing (idempotent)
      mockCheckoutStore.createOrGetPaymentIntent.mockResolvedValue(
        mockPaymentIntent,
      );
      mockCheckoutStore.transitionState.mockResolvedValue(undefined);

      const result = await service.createPaymentIntent(
        checkoutSessionId,
        amount,
      );

      expect(result).toEqual(mockPaymentIntent);
      // Provider should not be called if payment intent already exists
      expect(mockRazorpayInstance.orders.create).not.toHaveBeenCalled();
    });

    it("should throw if checkout state is not LOCKED", async () => {
      mockCheckoutStore.assertState.mockRejectedValue(
        new BadRequestException("Invalid state"),
      );

      await expect(
        service.createPaymentIntent(checkoutSessionId, amount),
      ).rejects.toThrow(BadRequestException);

      expect(mockCheckoutStore.createOrGetPaymentIntent).not.toHaveBeenCalled();
    });

    it("should handle provider failure gracefully", async () => {
      mockRazorpayInstance.orders.create.mockRejectedValue(
        new Error("Razorpay API error"),
      );

      // createOrGetPaymentIntent will call provider, which fails
      mockCheckoutStore.createOrGetPaymentIntent.mockRejectedValue(
        new BadRequestException("Failed to create Razorpay order"),
      );

      await expect(
        service.createPaymentIntent(checkoutSessionId, amount),
      ).rejects.toThrow(BadRequestException);

      expect(mockCheckoutStore.transitionState).not.toHaveBeenCalled();
    });

    it("should transition state to PAYMENT_PENDING after creation", async () => {
      const mockPaymentIntent: PaymentIntent = {
        paymentProvider: "razorpay",
        paymentIntentId,
        status: PaymentIntentStatus.CREATED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCheckoutStore.createOrGetPaymentIntent.mockResolvedValue(
        mockPaymentIntent,
      );
      mockCheckoutStore.transitionState.mockResolvedValue(undefined);

      await service.createPaymentIntent(checkoutSessionId, amount);

      expect(mockCheckoutStore.transitionState).toHaveBeenCalledWith(
        checkoutSessionId,
        CheckoutState.LOCKED,
        CheckoutState.PAYMENT_PENDING,
      );
    });
  });

  describe("handlePaymentCaptured - payment intent integration", () => {
    const webhookSecret = "webhook_secret_123";
    const signature = "valid_signature";

    const createWebhookEvent = (
      eventName: string,
      paymentId?: string,
      orderId?: string,
    ): RazorpayWebhookEventDto => ({
      entity: "event",
      account_id: "acc_MNOPQRSTUVWXYZ",
      event: eventName,
      contains: ["payment", "order"],
      payload: {
        payment: paymentId
          ? {
              entity: {
                id: paymentId,
                entity: "payment",
                amount: 100000,
                currency: "INR",
                status: "captured",
                order_id: orderId || "order_MNOPQRSTUVWXYZ",
                invoice_id: null,
                international: false,
                method: "card",
                amount_refunded: 0,
                refund_status: null,
                captured: true,
                description: null,
                card_id: null,
                bank: null,
                wallet: null,
                vpa: null,
                email: "test@example.com",
                contact: "+919999999999",
                notes: {},
                fee: 0,
                tax: 0,
                error_code: null,
                error_description: null,
                error_source: null,
                error_step: null,
                error_reason: null,
                acquirer_data: {},
                created_at: 1234567890,
              },
            }
          : undefined,
        order: orderId
          ? {
              entity: {
                id: orderId,
                entity: "order",
                amount: 100000,
                amount_paid: 0,
                amount_due: 100000,
                currency: "INR",
                receipt: "receipt_123",
                status: "created",
                attempts: 0,
                notes: {},
                created_at: 1234567890,
              },
            }
          : undefined,
      },
      created_at: 1234567890,
    });

    beforeEach(() => {
      process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
    });

    it("should update payment intent status when payment is captured", async () => {
      const crypto = require("crypto");
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(signature),
      };
      jest.spyOn(crypto, "createHmac").mockReturnValue(mockHmac);

      const paymentIntentId = "order_123456";
      const checkoutSessionId = "checkout-session-123";
      const paymentId = "pay_123456";

      const webhookEvent = createWebhookEvent(
        "payment.captured",
        paymentId,
        paymentIntentId,
      );

      const mockRazorpayOrder = {
        id: paymentIntentId,
        notes: {
          checkout_session_id: checkoutSessionId,
        },
      };

      const mockPaymentIntent: PaymentIntent = {
        paymentProvider: "razorpay",
        paymentIntentId,
        status: PaymentIntentStatus.CREATED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockOrder = {
        id: "order-id",
        razorpayOrderId: paymentIntentId,
        status: "pending",
      };

      // Mock getRazorpayOrderDetails to return the order
      jest.spyOn(service, "getRazorpayOrderDetails").mockResolvedValue(mockRazorpayOrder);
      mockCheckoutStore.get.mockResolvedValue(checkoutSessionId);
      mockCheckoutStore.getPaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockCheckoutStore.updatePaymentIntentStatus.mockResolvedValue(
        undefined,
      );
      mockCheckoutStore.getSession.mockResolvedValue({
        state: CheckoutState.PAYMENT_PENDING,
        cartId: "cart-123",
        paymentIntentId: null,
        orderId: null,
        updatedAt: new Date().toISOString(),
      });
      mockCheckoutStore.transitionState.mockResolvedValue(undefined);

      const selectOrderMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      });

      const updateOrderMock = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const insertPaymentMock = jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      (db.select as jest.Mock) = selectOrderMock;
      (db.update as jest.Mock) = updateOrderMock;
      (db.insert as jest.Mock) = insertPaymentMock;

      const result = await service.handleWebhook(webhookEvent, signature);

      expect(result.processed).toBe(true);
      expect(mockCheckoutStore.updatePaymentIntentStatus).toHaveBeenCalledWith(
        checkoutSessionId,
        PaymentIntentStatus.CONFIRMED,
      );
      expect(mockCheckoutStore.transitionState).toHaveBeenCalledWith(
        checkoutSessionId,
        CheckoutState.PAYMENT_PENDING,
        CheckoutState.PAYMENT_CONFIRMED,
      );
    });

    it("should use reverse lookup when checkoutSessionId not in notes", async () => {
      const crypto = require("crypto");
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(signature),
      };
      jest.spyOn(crypto, "createHmac").mockReturnValue(mockHmac);

      const paymentIntentId = "order_123456";
      const checkoutSessionId = "checkout-session-123";
      const paymentId = "pay_123456";

      const webhookEvent = createWebhookEvent(
        "payment.captured",
        paymentId,
        paymentIntentId,
      );

      const mockRazorpayOrder = {
        id: paymentIntentId,
        notes: {}, // No checkout_session_id in notes
      };

      const mockPaymentIntent: PaymentIntent = {
        paymentProvider: "razorpay",
        paymentIntentId,
        status: PaymentIntentStatus.CREATED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockOrder = {
        id: "order-id",
        razorpayOrderId: paymentIntentId,
        status: "pending",
      };

      // Mock getRazorpayOrderDetails to return the order (no checkout_session_id in notes)
      jest.spyOn(service, "getRazorpayOrderDetails").mockResolvedValue(mockRazorpayOrder);
      // Reverse lookup - getPaymentIntentByPaymentId must return truthy for code to proceed
      mockCheckoutStore.getPaymentIntentByPaymentId.mockResolvedValue(mockPaymentIntent);
      mockCheckoutStore.get.mockResolvedValue(checkoutSessionId);
      mockCheckoutStore.getPaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockCheckoutStore.updatePaymentIntentStatus.mockResolvedValue(
        undefined,
      );
      mockCheckoutStore.getSession.mockResolvedValue({
        state: CheckoutState.PAYMENT_PENDING,
        cartId: "cart-123",
        paymentIntentId: null,
        orderId: null,
        updatedAt: new Date().toISOString(),
      });
      mockCheckoutStore.transitionState.mockResolvedValue(undefined);

      const selectOrderMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      });

      const updateOrderMock = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const insertPaymentMock = jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      (db.select as jest.Mock) = selectOrderMock;
      (db.update as jest.Mock) = updateOrderMock;
      (db.insert as jest.Mock) = insertPaymentMock;

      const result = await service.handleWebhook(webhookEvent, signature);

      expect(result.processed).toBe(true);
      // Should use reverse lookup
      expect(mockCheckoutStore.get).toHaveBeenCalledWith(
        `payment:intent:by-id:${paymentIntentId}`,
      );
      expect(mockCheckoutStore.updatePaymentIntentStatus).toHaveBeenCalledWith(
        checkoutSessionId,
        PaymentIntentStatus.CONFIRMED,
      );
    });

    it("should handle duplicate webhooks idempotently", async () => {
      const crypto = require("crypto");
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(signature),
      };
      jest.spyOn(crypto, "createHmac").mockReturnValue(mockHmac);

      const paymentIntentId = "order_123456";
      const checkoutSessionId = "checkout-session-123";
      const paymentId = "pay_123456";

      const webhookEvent = createWebhookEvent(
        "payment.captured",
        paymentId,
        paymentIntentId,
      );

      const mockRazorpayOrder = {
        id: paymentIntentId,
        notes: {
          checkout_session_id: checkoutSessionId,
        },
      };

      const mockPaymentIntent: PaymentIntent = {
        paymentProvider: "razorpay",
        paymentIntentId,
        status: PaymentIntentStatus.CONFIRMED, // Already confirmed
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockOrder = {
        id: "order-id",
        razorpayOrderId: paymentIntentId,
        status: "confirmed", // Already confirmed
      };

      const mockExistingPayment = {
        id: "payment-id",
        razorpayPaymentId: paymentId,
        status: "captured",
      };

      // Mock getRazorpayOrderDetails to return the order
      jest.spyOn(service, "getRazorpayOrderDetails").mockResolvedValue(mockRazorpayOrder);
      mockCheckoutStore.getPaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockCheckoutStore.updatePaymentIntentStatus.mockResolvedValue(
        undefined,
      );
      mockCheckoutStore.getSession.mockResolvedValue({
        state: CheckoutState.PAYMENT_CONFIRMED, // Already confirmed
        cartId: "cart-123",
        paymentIntentId: null,
        orderId: null,
        updatedAt: new Date().toISOString(),
      });

      const selectOrderMock = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockOrder]),
      };

      const selectPaymentMock = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockExistingPayment]),
      };

      const updateOrderMock = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      };

      const updatePaymentMock = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      };

      // Mock payment selection - return different mocks based on what table is selected
      (db.select as jest.Mock).mockImplementation((args) => {
        if (args === payments) {
          return selectPaymentMock;
        }
        return selectOrderMock;
      });
      (db.update as jest.Mock).mockImplementation((args) => {
        if (args === payments) {
          return updatePaymentMock;
        }
        return updateOrderMock;
      });

      const result = await service.handleWebhook(webhookEvent, signature);

      expect(result.processed).toBe(true);
      // Should still update payment intent status (idempotent)
      expect(mockCheckoutStore.updatePaymentIntentStatus).toHaveBeenCalled();
      // Should not transition if already confirmed
      expect(mockCheckoutStore.transitionState).not.toHaveBeenCalled();
    });

    describe("Webhook-driven order creation", () => {
      const checkoutSessionId = "cs-123";
      const paymentIntentId = "order_123456";
      const cartId = "cart-123";
      const orderId = "order-123";

      const mockSession = {
        sessionId: checkoutSessionId,
        cartId,
        state: CheckoutState.PAYMENT_CONFIRMED,
        paymentIntentId,
        orderId: null,
        updatedAt: new Date().toISOString(),
      };

      const mockPaymentEntity = {
        id: "pay_test_123",
        order_id: paymentIntentId,
        amount: 10000,
        method: "card",
      };

      const createWebhookEvent = (
        eventName: string,
      ): RazorpayWebhookEventDto => ({
        entity: "event",
        account_id: "acc_test_123",
        event: eventName,
        contains: ["payment"],
        payload: {
          payment: {
            entity: mockPaymentEntity,
          },
          order: {
            entity: {
              id: paymentIntentId,
              notes: {
                checkout_session_id: checkoutSessionId,
              },
            },
          },
        },
        created_at: 1678886500,
      });

      const generateSignature = (payload: any, secret: string) => {
        const crypto = require("crypto");
        const hmac = crypto.createHmac("sha256", secret);
        hmac.update(JSON.stringify(payload));
        return hmac.digest("hex");
      };

      beforeEach(() => {
        process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret";
        // Mock Razorpay order fetch (used by getRazorpayOrderDetails)
        mockRazorpayInstance.orders.fetch.mockResolvedValue({
          id: paymentIntentId,
          notes: {
            checkout_session_id: checkoutSessionId,
          },
        });
        // Mock getPaymentIntentByPaymentId for reverse lookup
        mockCheckoutStore.getPaymentIntentByPaymentId.mockResolvedValue({
          checkoutSessionId,
          paymentIntentId,
          status: PaymentIntentStatus.CONFIRMED,
          paymentProvider: "razorpay",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        mockCheckoutStore.get.mockResolvedValue(checkoutSessionId);
        mockCheckoutStore.getSession.mockResolvedValue(mockSession);
        mockCheckoutStore.getPaymentIntent.mockResolvedValue({
          checkoutSessionId,
          paymentIntentId,
          status: PaymentIntentStatus.CREATED,
          paymentProvider: "razorpay",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        mockCheckoutStore.updatePaymentIntentStatus.mockResolvedValue(
          undefined,
        );
        mockCheckoutStore.transitionState.mockResolvedValue(undefined);
        mockCheckoutStore.acquireCheckoutLock.mockResolvedValue(true);
        mockCheckoutStore.releaseCheckoutLock.mockResolvedValue(undefined);
        mockCheckoutStore.getOrderByPaymentIntent.mockResolvedValue(null);
        mockOrdersService.finalizeOrderFromPayment.mockResolvedValue({
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
        } as any);

        // Mock DB operations
        (db.select as jest.Mock).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        });
        (db.insert as jest.Mock).mockReturnValue({
          values: jest.fn().mockResolvedValue(undefined),
        });
        (db.update as jest.Mock).mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(undefined),
          }),
        });
      });

      it("should create order when payment is captured (duplicate webhook - idempotent)", async () => {
        const webhookEvent = createWebhookEvent("payment.captured");
        const signature = generateSignature(webhookEvent, "test_webhook_secret");

        // First call - creates order
        await service.handleWebhook(webhookEvent, signature);

        expect(mockCheckoutStore.acquireCheckoutLock).toHaveBeenCalledWith(
          cartId,
        );
        expect(mockOrdersService.finalizeOrderFromPayment).toHaveBeenCalledWith(
          checkoutSessionId,
          paymentIntentId,
          "razorpay",
        );
        expect(mockCheckoutStore.releaseCheckoutLock).toHaveBeenCalledWith(
          cartId,
        );

        // Reset mocks but keep session state as COMPLETED
        jest.clearAllMocks();
        mockCheckoutStore.getSession.mockResolvedValue({
          ...mockSession,
          state: CheckoutState.COMPLETED,
        });
        mockCheckoutStore.getOrderByPaymentIntent.mockResolvedValue(orderId);

        // Second call - should return existing order (idempotent)
        await service.handleWebhook(webhookEvent, signature);

        // Should check for existing order when session is COMPLETED
        expect(mockCheckoutStore.getOrderByPaymentIntent).toHaveBeenCalledWith(
          "razorpay",
          paymentIntentId,
        );
        // Should not create order again
        expect(mockOrdersService.finalizeOrderFromPayment).not.toHaveBeenCalled();
      });

      it("should handle concurrent webhook workers (lock already held)", async () => {
        const webhookEvent = createWebhookEvent("payment.captured");
        const signature = generateSignature(webhookEvent, "test_webhook_secret");

        // Simulate lock already held
        mockCheckoutStore.acquireCheckoutLock.mockResolvedValue(false);
        mockCheckoutStore.getOrderByPaymentIntent.mockResolvedValue(orderId);

        await service.handleWebhook(webhookEvent, signature);

        // Should check for existing order when lock fails
        expect(mockCheckoutStore.getOrderByPaymentIntent).toHaveBeenCalledWith(
          "razorpay",
          paymentIntentId,
        );
        // Should not create order if already exists
        expect(mockOrdersService.finalizeOrderFromPayment).not.toHaveBeenCalled();
      });

      it("should handle late webhook events (checkout already COMPLETED)", async () => {
        const webhookEvent = createWebhookEvent("payment.captured");
        const signature = generateSignature(webhookEvent, "test_webhook_secret");

        // Mock session in COMPLETED state
        mockCheckoutStore.getSession.mockResolvedValue({
          ...mockSession,
          state: CheckoutState.COMPLETED,
        });
        mockCheckoutStore.getOrderByPaymentIntent.mockResolvedValue(orderId);

        await service.handleWebhook(webhookEvent, signature);

        // Should check for existing order
        expect(mockCheckoutStore.getOrderByPaymentIntent).toHaveBeenCalled();
        // Should not create order or acquire lock
        expect(mockCheckoutStore.acquireCheckoutLock).not.toHaveBeenCalled();
        expect(mockOrdersService.finalizeOrderFromPayment).not.toHaveBeenCalled();
      });

      it("should ignore webhook if checkout is FAILED", async () => {
        const webhookEvent = createWebhookEvent("payment.captured");
        const signature = generateSignature(webhookEvent, "test_webhook_secret");

        mockCheckoutStore.getSession.mockResolvedValue({
          ...mockSession,
          state: CheckoutState.FAILED,
        });

        await service.handleWebhook(webhookEvent, signature);

        // Should not process failed checkout
        expect(mockCheckoutStore.acquireCheckoutLock).not.toHaveBeenCalled();
        expect(mockOrdersService.finalizeOrderFromPayment).not.toHaveBeenCalled();
      });

      it("should handle Redis failures gracefully", async () => {
        const webhookEvent = createWebhookEvent("payment.captured");
        const signature = generateSignature(webhookEvent, "test_webhook_secret");

        // Simulate Redis failure during lock acquisition
        mockCheckoutStore.acquireCheckoutLock.mockRejectedValue(
          new Error("Redis connection failed"),
        );

        await expect(
          service.handleWebhook(webhookEvent, signature),
        ).rejects.toThrow("Redis connection failed");
      });

      it("should handle order creation failure and release lock", async () => {
        const webhookEvent = createWebhookEvent("payment.captured");
        const signature = generateSignature(webhookEvent, "test_webhook_secret");

        mockOrdersService.finalizeOrderFromPayment.mockRejectedValue(
          new Error("Order creation failed"),
        );

        await expect(
          service.handleWebhook(webhookEvent, signature),
        ).rejects.toThrow("Order creation failed");

        // Lock should be released even on failure
        expect(mockCheckoutStore.releaseCheckoutLock).toHaveBeenCalledWith(
          cartId,
        );
      });

      it("should handle invalid state transition (ORDER_CREATED without PAYMENT_CONFIRMED)", async () => {
        const webhookEvent = createWebhookEvent("payment.captured");
        const signature = generateSignature(webhookEvent, "test_webhook_secret");

        // Mock session in wrong state
        mockCheckoutStore.getSession.mockResolvedValue({
          ...mockSession,
          state: CheckoutState.PAYMENT_PENDING,
        });

        // Should still try to create order (state will be validated in finalizeOrderFromPayment)
        mockOrdersService.finalizeOrderFromPayment.mockRejectedValue(
          new ConflictException(
            "Cannot create order: checkout session is in state PAYMENT_PENDING, expected PAYMENT_CONFIRMED",
          ),
        );

        await expect(
          service.handleWebhook(webhookEvent, signature),
        ).rejects.toThrow(ConflictException);
      });
    });
  });
});
