import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { and, db, desc, eq, gte, lte, shipments, sql } from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../../../common/constants";
import { getCommonTestProviders } from "../../../common/testing/test-helpers";
import { ShipmentsService } from "./shipments.service";

// Mock @vcecom/db
jest.mock("@vcecom/db", () => {
  const createWhereResult = (returnValue: any) => {
    const promise = Promise.resolve(returnValue);
    (promise as any).limit = jest.fn(() => Promise.resolve(returnValue));
    (promise as any).offset = jest.fn(() => Promise.resolve(returnValue));
    (promise as any).orderBy = jest.fn(() => Promise.resolve(returnValue));
    return promise;
  };

  return {
      select: jest.fn(() => ({
        from: jest.fn(() => ({
          where: jest.fn(() => createWhereResult([])),
          orderBy: jest.fn(() => createWhereResult([])),
          limit: jest.fn(() => createWhereResult([])),
          offset: jest.fn(() => createWhereResult([])),
        })),
      })),
    },
    eq: jest.fn(),
    and: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    desc: jest.fn(),
    sql: jest.fn(() => ({
      mapWith: jest.fn(),
    })),
    shipments: {},
  };
});

describe("ShipmentsService", () => {
  let service: ShipmentsService;
  let logger: jest.Mocked<PinoLogger>;

  const mockShipmentId = "shipment-123";
  const mockOrderId = "order-123";

  const mockShipment = {
    id: mockShipmentId,
    orderId: mockOrderId,
    awbNumber: "AWB123456",
    status: "pending",
    provider: "shiprocket",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShipmentsService, ...getCommonTestProviders()],
    }).compile();

    service = module.get<ShipmentsService>(ShipmentsService);
    logger = module.get(PinoLogger) as jest.Mocked<PinoLogger>;

    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("should return paginated shipments without filters", async () => {
      // Arrange
      const mockShipments = [mockShipment];
      const mockCount = [{ count: 1 }];

      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockCount),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue(mockShipments),
                }),
              }),
            }),
          }),
        });

      // Act
      const result = await service.findAll();

      // Assert
      expect(result.data).toEqual(mockShipments);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(DEFAULT_PAGE_SIZE);
      expect(result.pagination.total).toBe(1);
    });

    it("should filter by orderId", async () => {
      // Arrange
      const filters = { orderId: mockOrderId };
      const mockShipments = [mockShipment];
      const mockCount = [{ count: 1 }];

      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockCount),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue(mockShipments),
                }),
              }),
            }),
          }),
        });

      // Act
      const result = await service.findAll(filters);

      // Assert
      expect(result.data).toEqual(mockShipments);
      expect(eq).toHaveBeenCalledWith(shipments.orderId, mockOrderId);
    });

    it("should filter by status", async () => {
      // Arrange
      const filters = { status: "pending" };
      const mockShipments = [mockShipment];
      const mockCount = [{ count: 1 }];

      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockCount),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue(mockShipments),
                }),
              }),
            }),
          }),
        });

      // Act
      const result = await service.findAll(filters);

      // Assert
      expect(result.data).toEqual(mockShipments);
      expect(eq).toHaveBeenCalledWith(shipments.status, "pending");
    });

    it("should handle pagination correctly", async () => {
      // Arrange
      const filters = { page: 2, limit: 5 };
      const mockShipments = [mockShipment];
      const mockCount = [{ count: 10 }];

      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockCount),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue(mockShipments),
                }),
              }),
            }),
          }),
        });

      // Act
      const result = await service.findAll(filters);

      // Assert
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.totalPages).toBe(2);
    });

    it("should respect MAX_PAGE_SIZE limit", async () => {
      // Arrange
      const filters = { limit: MAX_PAGE_SIZE + 100 };
      const mockCount = [{ count: 0 }];

      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockCount),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        });

      // Act
      const result = await service.findAll(filters);

      // Assert
      expect(result.pagination.limit).toBe(MAX_PAGE_SIZE);
    });
  });

  describe("findOne", () => {
    it("should return shipment by ID", async () => {
      // Arrange
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockShipment]),
          }),
        }),
      });

      // Act
      const result = await service.findOne(mockShipmentId);

      // Assert
      expect(result).toEqual(mockShipment);
      expect(eq).toHaveBeenCalledWith(shipments.id, mockShipmentId);
    });

    it("should throw NotFoundException when shipment does not exist", async () => {
      // Arrange
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Act & Assert
      await expect(service.findOne(mockShipmentId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(mockShipmentId)).rejects.toThrow(
        `Shipment with ID ${mockShipmentId} not found`,
      );
    });
  });

  describe("findByOrderId", () => {
    it("should return shipments for an order", async () => {
      // Arrange
      const mockShipments = [mockShipment];
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockShipments),
          }),
        }),
      });

      // Act
      const result = await service.findByOrderId(mockOrderId);

      // Assert
      expect(result).toEqual(mockShipments);
      expect(eq).toHaveBeenCalledWith(shipments.orderId, mockOrderId);
      expect(desc).toHaveBeenCalledWith(shipments.createdAt);
    });

    it("should return empty array when no shipments found", async () => {
      // Arrange
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Act
      const result = await service.findByOrderId(mockOrderId);

      // Assert
      expect(result).toEqual([]);
    });
  });
});

