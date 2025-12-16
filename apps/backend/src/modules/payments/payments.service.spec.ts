import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { db, eq, orders, payments } from "@vcecom/db";
import Razorpay from "razorpay";
import { CheckoutState } from "../redis-store/constants/checkout-states";
import {
  PaymentIntent,
  PaymentIntentStatus,
} from "../redis-store/dto/payment-intent.dto";
import { CheckoutStore } from "../redis-store/stores/checkout-store";
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
  db: {
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
  let mockRazorpayInstance: any;

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
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    razorpayConfigService =
      module.get<RazorpayConfigService>(RazorpayConfigService);
    mockCheckoutStore = module.get<CheckoutStore>(CheckoutStore);

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

      const newService = new PaymentsService(
        razorpayConfigService,
        mockCheckoutStore,
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

      const newService = new PaymentsService(
        razorpayConfigService,
        mockCheckoutStore,
      );
      newService.onModuleInit();

      expect(razorpayConfigService.initialize).not.toHaveBeenCalled();
    });

    it("should not initialize Razorpay when keySecret is missing", () => {
      jest.clearAllMocks();
      process.env.RAZORPAY_KEY_ID = "rzp_test_1234567890";
      delete process.env.RAZORPAY_KEY_SECRET;

      const newService = new PaymentsService(
        razorpayConfigService,
        mockCheckoutStore,
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
      const newService = new PaymentsService(
        razorpayConfigService,
        mockCheckoutStore,
      );
      expect(() => newService.getRazorpayInstance()).toThrow(
        "Razorpay is not initialized. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.",
      );
    });
  });

  describe("isInitialized", () => {
    it("should return false when not initialized", () => {
      const newService = new PaymentsService(
        razorpayConfigService,
        mockCheckoutStore,
      );
      expect(newService.isInitialized()).toBe(false);
    });

    it("should return true after initialization", () => {
      expect(service.isInitialized()).toBe(true);
    });
  });

  describe("initialize", () => {
    it("should initialize Razorpay with provided credentials", () => {
      const newService = new PaymentsService(
        razorpayConfigService,
        mockCheckoutStore,
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

      // Mock getRazorpayOrderDetails to return the order
      jest.spyOn(service, "getRazorpayOrderDetails").mockResolvedValue(mockRazorpayOrder);
      // Reverse lookup
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
  });
});
