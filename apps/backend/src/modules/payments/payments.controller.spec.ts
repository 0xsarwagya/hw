import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, Reflector } from "@nestjs/core";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RolesGuard } from "../../common/guards/roles.guard";
import {
  CreateRazorpayOrderDto,
  RazorpayOrderResponseDto,
} from "./dto/create-razorpay-order.dto";
import { RazorpayConfigDto } from "./dto/razorpay-config.dto";
import {
  PaymentVerificationResponseDto,
  VerifyPaymentDto,
} from "./dto/verify-payment.dto";
import { RazorpayWebhookEventDto } from "./dto/webhook-event.dto";

describe("PaymentsController", () => {
  let controller: PaymentsController;
  let paymentsService: PaymentsService;

  const mockPaymentsService = {
    isInitialized: jest.fn(),
    initialize: jest.fn(),
    createRazorpayOrder: jest.fn(),
    verifyPayment: jest.fn(),
    getPaymentDetails: jest.fn(),
    getRazorpayOrderDetails: jest.fn(),
    handleWebhook: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    paymentsService = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getRazorpayStatus", () => {
    it("should return initialization status when initialized", () => {
      mockPaymentsService.isInitialized.mockReturnValue(true);

      const result = controller.getRazorpayStatus();

      expect(result).toEqual({
        initialized: true,
        message: "Razorpay is initialized",
      });
      expect(paymentsService.isInitialized).toHaveBeenCalled();
    });

    it("should return not initialized status when not initialized", () => {
      mockPaymentsService.isInitialized.mockReturnValue(false);

      const result = controller.getRazorpayStatus();

      expect(result).toEqual({
        initialized: false,
        message: "Razorpay is not initialized",
      });
      expect(paymentsService.isInitialized).toHaveBeenCalled();
    });
  });

  describe("initializeRazorpay", () => {
    const validConfig: RazorpayConfigDto = {
      keyId: "rzp_test_1234567890",
      keySecret: "secret_1234567890",
    };

    it("should initialize Razorpay with valid config", () => {
      mockPaymentsService.initialize.mockReturnValue(undefined);

      const result = controller.initializeRazorpay(validConfig);

      expect(result).toEqual({
        initialized: true,
        message: "Razorpay initialized successfully",
      });
      expect(paymentsService.initialize).toHaveBeenCalledWith(
        validConfig.keyId,
        validConfig.keySecret,
      );
    });
  });

  describe("createRazorpayOrder", () => {
    const createDto: CreateRazorpayOrderDto = {
      orderId: "123e4567-e89b-12d3-a456-426614174000",
      amount: 100000,
      currency: "INR",
    };

    const mockRazorpayOrder: RazorpayOrderResponseDto = {
      id: "order_MNOPQRSTUVWXYZ",
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
    };

    it("should create Razorpay order successfully", async () => {
      mockPaymentsService.createRazorpayOrder.mockResolvedValue(
        mockRazorpayOrder,
      );

      const result = await controller.createRazorpayOrder(createDto);

      expect(result).toEqual(mockRazorpayOrder);
      expect(paymentsService.createRazorpayOrder).toHaveBeenCalledWith(
        createDto,
      );
    });

    it("should throw NotFoundException when order does not exist", async () => {
      mockPaymentsService.createRazorpayOrder.mockRejectedValue(
        new NotFoundException("Order not found"),
      );

      await expect(
        controller.createRazorpayOrder(createDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("verifyPayment", () => {
    const verifyDto: VerifyPaymentDto = {
      razorpay_order_id: "order_MNOPQRSTUVWXYZ",
      razorpay_payment_id: "pay_MNOPQRSTUVWXYZ",
      razorpay_signature: "abc123def456",
    };

    it("should verify payment successfully", async () => {
      mockPaymentsService.verifyPayment.mockResolvedValue({
        verified: true,
        message: "Payment signature verified successfully",
      });

      const result = await controller.verifyPayment(verifyDto);

      expect(result.verified).toBe(true);
      expect(result.message).toBe("Payment signature verified successfully");
      expect(paymentsService.verifyPayment).toHaveBeenCalledWith(verifyDto);
    });

    it("should return false when verification fails", async () => {
      mockPaymentsService.verifyPayment.mockResolvedValue({
        verified: false,
        message: "Payment signature verification failed",
      });

      const result = await controller.verifyPayment(verifyDto);

      expect(result.verified).toBe(false);
      expect(result.message).toBe("Payment signature verification failed");
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
      mockPaymentsService.getPaymentDetails.mockResolvedValue(mockPayment);

      const result = await controller.getPaymentDetails(paymentId);

      expect(result).toEqual(mockPayment);
      expect(paymentsService.getPaymentDetails).toHaveBeenCalledWith(
        paymentId,
      );
    });

    it("should throw NotFoundException when payment does not exist", async () => {
      mockPaymentsService.getPaymentDetails.mockRejectedValue(
        new NotFoundException("Payment not found"),
      );

      await expect(
        controller.getPaymentDetails(paymentId),
      ).rejects.toThrow(NotFoundException);
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
      mockPaymentsService.getRazorpayOrderDetails.mockResolvedValue(
        mockRazorpayOrder,
      );

      const result = await controller.getRazorpayOrderDetails(orderId);

      expect(result).toEqual(mockRazorpayOrder);
      expect(paymentsService.getRazorpayOrderDetails).toHaveBeenCalledWith(
        orderId,
      );
    });
  });

  describe("handleWebhook", () => {
    const signature = "valid_signature";
    const webhookEvent: RazorpayWebhookEventDto = {
      entity: "event",
      account_id: "acc_MNOPQRSTUVWXYZ",
      event: "payment.captured",
      contains: ["payment"],
      payload: {
        payment: {
          entity: {
            id: "pay_MNOPQRSTUVWXYZ",
            entity: "payment",
            amount: 100000,
            currency: "INR",
            status: "captured",
            order_id: "order_MNOPQRSTUVWXYZ",
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
        },
      },
      created_at: 1234567890,
    };

    it("should handle webhook successfully", async () => {
      mockPaymentsService.handleWebhook.mockResolvedValue({
        processed: true,
        message: "Event payment.captured processed successfully",
      });

      const req = {
        rawBody: Buffer.from(JSON.stringify(webhookEvent)),
        body: webhookEvent,
      } as any;

      const result = await controller.handleWebhook(req, signature);

      expect(result.processed).toBe(true);
      expect(paymentsService.handleWebhook).toHaveBeenCalledWith(
        webhookEvent,
        signature,
      );
    });

    it("should throw BadRequestException when signature header is missing", async () => {
      const req = {
        rawBody: Buffer.from(JSON.stringify(webhookEvent)),
        body: webhookEvent,
      } as any;

      await expect(controller.handleWebhook(req, "")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should parse body from rawBody buffer", async () => {
      mockPaymentsService.handleWebhook.mockResolvedValue({
        processed: true,
        message: "Event processed",
      });

      const req = {
        rawBody: Buffer.from(JSON.stringify(webhookEvent)),
        body: null,
      } as any;

      await controller.handleWebhook(req, signature);

      expect(paymentsService.handleWebhook).toHaveBeenCalledWith(
        webhookEvent,
        signature,
      );
    });

    it("should parse body from string", async () => {
      mockPaymentsService.handleWebhook.mockResolvedValue({
        processed: true,
        message: "Event processed",
      });

      const req = {
        rawBody: null,
        body: JSON.stringify(webhookEvent),
      } as any;

      await controller.handleWebhook(req, signature);

      expect(paymentsService.handleWebhook).toHaveBeenCalledWith(
        webhookEvent,
        signature,
      );
    });

    it("should throw BadRequestException when body is invalid", async () => {
      const req = {
        rawBody: null,
        body: null,
      } as any;

      await expect(controller.handleWebhook(req, signature)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("Role-based access control", () => {
    let module: TestingModule;
    let reflector: Reflector;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        controllers: [PaymentsController],
        providers: [
          {
            provide: PaymentsService,
            useValue: mockPaymentsService,
          },
        ],
      }).compile();

      reflector = module.get(Reflector);
    });

    it("should allow admin to access getRazorpayStatus", () => {
      const rolesGuard = new RolesGuard(reflector);
      const context = {
        getHandler: () => controller.getRazorpayStatus,
        getClass: () => PaymentsController,
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              userId: "admin-id",
              email: "admin@example.com",
              role: "admin",
            },
          }),
        }),
      } as ExecutionContext;

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it("should allow admin and customer to access createRazorpayOrder", () => {
      const rolesGuard = new RolesGuard(reflector);
      const context = {
        getHandler: () => controller.createRazorpayOrder,
        getClass: () => PaymentsController,
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              userId: "customer-id",
              email: "customer@example.com",
              role: "customer",
            },
          }),
        }),
      } as ExecutionContext;

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it("should allow admin and customer to access verifyPayment", () => {
      const rolesGuard = new RolesGuard(reflector);
      const context = {
        getHandler: () => controller.verifyPayment,
        getClass: () => PaymentsController,
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              userId: "customer-id",
              email: "customer@example.com",
              role: "customer",
            },
          }),
        }),
      } as ExecutionContext;

      expect(rolesGuard.canActivate(context)).toBe(true);
    });
  });
});
