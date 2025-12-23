import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { db, eq, orders, payments } from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import { COD_PAYMENT_METHOD } from "../../../common/constants/orders.constants";
import { getCommonTestProviders } from "../../../common/testing/test-helpers";
import { OrderTimelineService } from "./order-timeline.service";
import { OrderPaymentService } from "./order-payment.service";

// Mock @vcecom/db
jest.mock("@vcecom/db", () => {
  const createWhereResult = (returnValue: any) => {
    const promise = Promise.resolve(returnValue);
    (promise as any).limit = jest.fn(() => Promise.resolve(returnValue));
    return promise;
  };

  return {
      select: jest.fn(() => ({
        from: jest.fn(() => ({
          where: jest.fn(() => createWhereResult([])),
        })),
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn().mockResolvedValue(undefined),
        })),
      })),
    },
    eq: jest.fn(),
    and: jest.fn(),
    orders: {},
    payments: {},
  };
});

describe("OrderPaymentService", () => {
  let service: OrderPaymentService;
  let timelineService: jest.Mocked<OrderTimelineService>;
  let logger: jest.Mocked<PinoLogger>;

  const mockOrderId = "order-123";
  const mockPaymentId = "payment-123";
  const mockAdminId = "admin-123";
  const mockAdminName = "Admin User";
  const mockAdminEmail = "admin@example.com";

  const mockOrder = {
    id: mockOrderId,
    orderNumber: "ORD-001",
    status: "pending",
    total: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCodPayment = {
    id: mockPaymentId,
    orderId: mockOrderId,
    method: COD_PAYMENT_METHOD,
    status: "pending",
    amount: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCapturedPayment = {
    ...mockCodPayment,
    status: "captured",
  };

  beforeEach(async () => {
    const mockTimelineService = {
      addEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderPaymentService,
        {
          provide: OrderTimelineService,
          useValue: mockTimelineService,
        },
        ...getCommonTestProviders(),
      ],
    }).compile();

    service = module.get<OrderPaymentService>(OrderPaymentService);
    timelineService = module.get(OrderTimelineService) as jest.Mocked<OrderTimelineService>;
    logger = module.get(PinoLogger) as jest.Mocked<PinoLogger>;

    jest.clearAllMocks();
    // Reset and set up default mock implementation
    (db.select as jest.Mock).mockReset();
    (db.select as jest.Mock).mockImplementation(() => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    }));
  });

  describe("markAsPaid", () => {
    it("should mark COD order as paid successfully", async () => {
      // Arrange
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
              limit: jest.fn().mockResolvedValue([mockCodPayment]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockOrder]),
            }),
          }),
        });

      // Mock update to handle both payment and order updates
      (db.update as jest.Mock).mockImplementation(() => {
        return {
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
        };
      });

      // Act
      const result = await service.markAsPaid(
        mockOrderId,
        mockAdminId,
        mockAdminName,
        mockAdminEmail,
      );

      // Assert
      expect(result).toEqual(mockOrder);
      
      // Verify payment status update
      expect(db.update).toHaveBeenCalledWith(payments);
      const paymentUpdateCall = (db.update as jest.Mock).mock.results[0].value;
      expect(paymentUpdateCall.set).toHaveBeenCalledWith({
        status: "captured",
        updatedAt: expect.any(Date),
      });
      
      // Verify order status update (should update to "confirmed" if pending)
      expect(db.update).toHaveBeenCalledWith(orders);
      const orderUpdateCall = (db.update as jest.Mock).mock.results[1].value;
      expect(orderUpdateCall.set).toHaveBeenCalledWith({
        status: "confirmed",
        updatedAt: expect.any(Date),
      });
      
      // Verify update was called twice (payment + order)
      expect(db.update).toHaveBeenCalledTimes(2);
      
      // Verify timeline event
      expect(timelineService.addEvent).toHaveBeenCalledWith(mockOrderId, {
        type: "order_marked_paid",
        title: "Order Marked as Paid",
        description: `COD order marked as paid by admin (${mockAdminName})`,
        actor: "admin",
        actorId: mockAdminId,
        actorName: mockAdminName,
        actorEmail: mockAdminEmail,
        timestamp: expect.any(Date),
      });
      
      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: mockOrderId,
          adminId: mockAdminId,
          adminName: mockAdminName,
          adminEmail: mockAdminEmail,
          paymentId: mockPaymentId,
          paymentMethod: COD_PAYMENT_METHOD,
          previousStatus: "pending",
          orderStatus: mockOrder.status,
        }),
        "COD order marked as paid by admin",
      );
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
        service.markAsPaid(mockOrderId, mockAdminId, mockAdminName, mockAdminEmail),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.markAsPaid(mockOrderId, mockAdminId, mockAdminName, mockAdminEmail),
      ).rejects.toThrow(`Order with ID ${mockOrderId} not found`);
    });

    it("should throw BadRequestException when payment record does not exist", async () => {
      // Arrange - need 4 mock returns (2 for each service call since test calls it twice)
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
              limit: jest.fn().mockResolvedValue([]),
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
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        });

      // Act & Assert
      await expect(
        service.markAsPaid(mockOrderId, mockAdminId, mockAdminName, mockAdminEmail),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.markAsPaid(mockOrderId, mockAdminId, mockAdminName, mockAdminEmail),
      ).rejects.toThrow("Order does not have a payment record");
    });

    it("should throw BadRequestException when payment method is not COD", async () => {
      // Arrange
      const nonCodPayment = {
        ...mockCodPayment,
        method: "razorpay",
      };

      let callCount = 0;
      (db.select as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: get order
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockOrder]),
              }),
            }),
          };
        }
        // Second call: get payment (non-COD)
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([nonCodPayment]),
            }),
          }),
        };
      });

      // Act & Assert
      await expect(
        service.markAsPaid(mockOrderId, mockAdminId, mockAdminName, mockAdminEmail),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.markAsPaid(mockOrderId, mockAdminId, mockAdminName, mockAdminEmail),
      ).rejects.toThrow(
        `Order payment method is ${nonCodPayment.method}, not COD. Only COD orders can be marked as paid manually.`,
      );
    });

    it("should accept uppercase COD payment method", async () => {
      // Arrange - test case-insensitive COD detection
      const uppercaseCodPayment = {
        ...mockCodPayment,
        method: "COD", // Uppercase COD
      };

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
              limit: jest.fn().mockResolvedValue([uppercaseCodPayment]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockOrder]),
            }),
          }),
        });

      // Mock update to handle both payment and order updates
      (db.update as jest.Mock).mockImplementation(() => {
        return {
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(undefined),
          }),
        };
      });

      // Act
      const result = await service.markAsPaid(
        mockOrderId,
        mockAdminId,
        mockAdminName,
        mockAdminEmail,
      );

      // Assert - should succeed with uppercase COD
      expect(result).toEqual(mockOrder);
      expect(db.update).toHaveBeenCalledWith(payments);
      expect(db.update).toHaveBeenCalledWith(orders);
    });

    it("should throw BadRequestException when order is already paid", async () => {
      // Arrange
      let callCount = 0;
      (db.select as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: get order
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockOrder]),
              }),
            }),
          };
        }
        // Second call: get payment (already captured)
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockCapturedPayment]),
            }),
          }),
        };
      });

      // Act & Assert
      await expect(
        service.markAsPaid(mockOrderId, mockAdminId, mockAdminName, mockAdminEmail),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.markAsPaid(mockOrderId, mockAdminId, mockAdminName, mockAdminEmail),
      ).rejects.toThrow("Order is already marked as paid");
    });
  });
});

