import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { and, db, desc, eq, orders, payments, refunds } from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import Razorpay from "razorpay";
import {
  MAX_REFUND_AMOUNT_MULTIPLIER,
  MIN_REFUND_AMOUNT_INR,
} from "../../../common/constants/orders.constants";
import { AppConfigService } from "../../../common/config/app.config.service";
import { getCommonTestProviders } from "../../../common/testing/test-helpers";
import { RazorpayConfigService } from "../../payments/razorpay-config.service";
import { OrderTimelineService } from "./order-timeline.service";
import { RefundsService } from "./refunds.service";

// Mock @vcecom/db
jest.mock("@vcecom/db", () => {
  const createWhereResult = (returnValue: any) => {
    const promise = Promise.resolve(returnValue);
    (promise as any).limit = jest.fn(() => Promise.resolve(returnValue));
    return promise;
  };

  return {
    db: {
      select: jest.fn(() => ({
        from: jest.fn(() => ({
          where: jest.fn(() => Promise.resolve([])),
          orderBy: jest.fn(() => Promise.resolve([])),
        })),
      })),
      insert: jest.fn(() => ({
        values: jest.fn(() => ({
          returning: jest.fn(() => Promise.resolve([])),
        })),
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => ({
            returning: jest.fn(() => Promise.resolve([])),
          })),
        })),
      })),
      sql: jest.fn(() => ({
        mapWith: jest.fn(),
      })),
    },
    eq: jest.fn(),
    and: jest.fn(),
    desc: jest.fn(),
    sql: jest.fn(),
    orders: {},
    payments: {},
    refunds: {},
  };
});

// Mock Razorpay
jest.mock("razorpay");

describe("RefundsService", () => {
  let service: RefundsService;
  let timelineService: jest.Mocked<OrderTimelineService>;
  let razorpayConfigService: jest.Mocked<RazorpayConfigService>;
  let appConfigService: jest.Mocked<AppConfigService>;
  let logger: jest.Mocked<PinoLogger>;

  const mockOrderId = "order-123";
  const mockRefundId = "refund-123";
  const mockPaymentId = "payment-123";
  const mockRazorpayPaymentId = "rzp_payment_123";

  const mockOrder = {
    id: mockOrderId,
    orderNumber: "ORD-001",
    status: "pending",
    total: 1000,
    razorpayOrderId: "rzp_order_123",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPayment = {
    id: mockPaymentId,
    orderId: mockOrderId,
    razorpayPaymentId: mockRazorpayPaymentId,
    status: "captured",
    amount: 1000,
    method: "razorpay",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRefund = {
    id: mockRefundId,
    orderId: mockOrderId,
    amount: 500,
    reason: "Customer request",
    status: "pending",
    providerRefundId: null,
    processedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockTimelineService = {
      addEvent: jest.fn().mockResolvedValue(undefined),
    };

    const mockRazorpayConfigService = {
      initialize: jest.fn().mockReturnValue({
        payments: {
          refund: jest.fn(),
        },
      } as unknown as Razorpay),
    };

    const mockAppConfigService = {
      getRazorpayConfig: jest.fn().mockReturnValue({
        keyId: "test_key",
        keySecret: "test_secret",
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundsService,
        {
          provide: OrderTimelineService,
          useValue: mockTimelineService,
        },
        {
          provide: RazorpayConfigService,
          useValue: mockRazorpayConfigService,
        },
        {
          provide: AppConfigService,
          useValue: mockAppConfigService,
        },
        ...getCommonTestProviders(),
      ],
    }).compile();

    service = module.get<RefundsService>(RefundsService);
    timelineService = module.get(OrderTimelineService) as jest.Mocked<OrderTimelineService>;
    razorpayConfigService = module.get(RazorpayConfigService) as jest.Mocked<RazorpayConfigService>;
    appConfigService = module.get(AppConfigService) as jest.Mocked<AppConfigService>;
    logger = module.get(PinoLogger) as jest.Mocked<PinoLogger>;

    jest.clearAllMocks();
  });

  describe("findByOrderId", () => {
    it("should return refunds for an order", async () => {
      // Arrange
      const mockRefunds = [mockRefund];
      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockOrder]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue(mockRefunds),
            }),
          }),
        });

      // Act
      const result = await service.findByOrderId(mockOrderId);

      // Assert
      expect(result).toEqual(mockRefunds);
      expect(db.select).toHaveBeenCalledTimes(2);
      expect(eq).toHaveBeenCalledWith(orders.id, mockOrderId);
      expect(eq).toHaveBeenCalledWith(refunds.orderId, mockOrderId);
    });

    it("should throw NotFoundException when order does not exist", async () => {
      // Arrange
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Act & Assert
      await expect(service.findByOrderId(mockOrderId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByOrderId(mockOrderId)).rejects.toThrow(
        `Order with ID ${mockOrderId} not found`,
      );
    });
  });

  describe("create", () => {
    it("should create a refund successfully", async () => {
      // Arrange
      const amount = 500;
      const reason = "Customer request";

      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockOrder]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        });

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockRefund]),
        }),
      });

      // Act
      const result = await service.create(mockOrderId, amount, reason);

      // Assert
      expect(result).toEqual(mockRefund);
      expect(db.insert).toHaveBeenCalledWith(refunds);
      expect(timelineService.addEvent).toHaveBeenCalledWith(mockOrderId, {
        type: "refund_created",
        title: "Refund Created",
        description: `Refund of ₹${amount} created. Reason: ${reason}`,
        actor: "admin",
        timestamp: mockRefund.createdAt,
        metadata: {
          refundId: mockRefundId,
          amount,
          reason,
          status: "pending",
        },
      });
      expect(logger.info).toHaveBeenCalled();
    });

    it("should throw BadRequestException when amount is zero", async () => {
      // Act & Assert
      await expect(
        service.create(mockOrderId, 0, "Reason"),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(mockOrderId, 0, "Reason"),
      ).rejects.toThrow("Refund amount must be greater than 0");
    });

    it("should throw BadRequestException when amount is negative", async () => {
      // Act & Assert
      await expect(
        service.create(mockOrderId, -100, "Reason"),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(mockOrderId, -100, "Reason"),
      ).rejects.toThrow("Refund amount must be greater than 0");
    });

    it("should throw BadRequestException when amount is below minimum", async () => {
      // Arrange - need to mock order query first since amount > 0 check happens first
      const amountBelowMin = MIN_REFUND_AMOUNT_INR - 1;
      // This will pass the > 0 check but fail the >= MIN check
      if (amountBelowMin > 0) {
        (db.select as jest.Mock).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockOrder]),
            }),
          }),
        });

        // Act & Assert
        await expect(
          service.create(mockOrderId, amountBelowMin, "Reason"),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.create(mockOrderId, amountBelowMin, "Reason"),
        ).rejects.toThrow(
          `Refund amount must be at least ${MIN_REFUND_AMOUNT_INR} INR`,
        );
      } else {
        // If MIN_REFUND_AMOUNT_INR is 1, then MIN - 1 = 0, which fails the > 0 check
        await expect(
          service.create(mockOrderId, amountBelowMin, "Reason"),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.create(mockOrderId, amountBelowMin, "Reason"),
        ).rejects.toThrow("Refund amount must be greater than 0");
      }
    });

    it("should throw BadRequestException when reason is empty", async () => {
      // Act & Assert
      await expect(
        service.create(mockOrderId, 100, ""),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(mockOrderId, 100, "   "),
      ).rejects.toThrow("Refund reason is required");
    });

    it("should throw NotFoundException when order does not exist", async () => {
      // Arrange
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Act & Assert
      await expect(
        service.create(mockOrderId, 100, "Reason"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException when refund amount exceeds limit", async () => {
      // Arrange
      const existingRefunds = [
        {
          ...mockRefund,
          amount: mockOrder.total * MAX_REFUND_AMOUNT_MULTIPLIER - 100,
        },
      ];
      const excessiveAmount = 200; // Would exceed limit

      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockOrder]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(existingRefunds),
          }),
        });

      // Act & Assert
      await expect(
        service.create(mockOrderId, excessiveAmount, "Reason"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("processRefund", () => {
    it("should process refund successfully via Razorpay", async () => {
      // Arrange
      const mockRazorpayRefund = {
        id: "rzp_refund_123",
        amount: 50000, // in paise
        status: "processed",
      };

      const mockRazorpayInstance = {
        payments: {
          refund: jest.fn().mockResolvedValue(mockRazorpayRefund),
        },
      };

      (service as any).razorpay = mockRazorpayInstance;

      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockRefund]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockOrder]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockPayment]),
            }),
          }),
        });

      const updatedRefund = {
        ...mockRefund,
        status: "completed",
        providerRefundId: mockRazorpayRefund.id,
        processedAt: new Date(),
      };

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedRefund]),
          }),
        }),
      });

      // Act
      const result = await service.processRefund(mockRefundId);

      // Assert
      expect(result).toEqual(updatedRefund);
      expect(mockRazorpayInstance.payments.refund).toHaveBeenCalledWith(
        mockRazorpayPaymentId,
        {
          amount: Math.round(mockRefund.amount * 100),
          notes: {
            reason: mockRefund.reason,
            order_id: mockOrderId,
          },
        },
      );
      expect(timelineService.addEvent).toHaveBeenCalled();
    });

    it("should throw NotFoundException when refund does not exist", async () => {
      // Arrange
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Act & Assert
      await expect(service.processRefund(mockRefundId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException when refund is not pending", async () => {
      // Arrange
      const completedRefund = {
        ...mockRefund,
        status: "completed",
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([completedRefund]),
          }),
        }),
      });

      // Act & Assert
      await expect(service.processRefund(mockRefundId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

