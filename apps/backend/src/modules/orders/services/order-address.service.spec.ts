import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { and, db, eq, addresses, orders } from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import { getCommonTestProviders } from "../../../common/testing/test-helpers";
import { OrderTimelineService } from "./order-timeline.service";
import { OrderAddressService } from "./order-address.service";

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
          where: jest.fn(() => createWhereResult([])),
        })),
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => ({
            returning: jest.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    },
    eq: jest.fn(),
    and: jest.fn(),
    addresses: {},
    orders: {},
  };
});

describe("OrderAddressService", () => {
  let service: OrderAddressService;
  let timelineService: jest.Mocked<OrderTimelineService>;
  let logger: jest.Mocked<PinoLogger>;

  const mockOrderId = "order-123";
  const mockShippingAddressId = "shipping-address-123";
  const mockBillingAddressId = "billing-address-123";
  const mockAdminId = "admin-123";

  const mockOrder = {
    id: mockOrderId,
    orderNumber: "ORD-001",
    shippingAddressId: mockShippingAddressId,
    billingAddressId: mockBillingAddressId,
    status: "pending",
    total: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAddress = {
    id: mockShippingAddressId,
    street: "123 Main St",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    country: "India",
    district: "Mumbai",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validAddressData = {
    street: "456 New St",
    city: "Delhi",
    state: "Delhi",
    pincode: "110001",
    country: "India",
    district: "Central Delhi",
  };

  beforeEach(async () => {
    const mockTimelineService = {
      addEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderAddressService,
        {
          provide: OrderTimelineService,
          useValue: mockTimelineService,
        },
        ...getCommonTestProviders(),
      ],
    }).compile();

    service = module.get<OrderAddressService>(OrderAddressService);
    timelineService = module.get(OrderTimelineService) as jest.Mocked<OrderTimelineService>;
    logger = module.get(PinoLogger) as jest.Mocked<PinoLogger>;

    jest.clearAllMocks();
  });

  describe("updateAddress", () => {
    it("should update shipping address successfully", async () => {
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
              limit: jest.fn().mockResolvedValue([mockOrder]),
            }),
          }),
        });

      const updatedAddress = {
        ...mockAddress,
        ...validAddressData,
      };

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedAddress]),
          }),
        }),
      });

      // Act
      const result = await service.updateAddress(
        mockOrderId,
        "shipping",
        validAddressData,
        mockAdminId,
      );

      // Assert
      expect(result).toEqual(mockOrder);
      expect(db.update).toHaveBeenCalledWith(addresses);
      expect(timelineService.addEvent).toHaveBeenCalledWith(mockOrderId, {
        type: "address_updated",
        title: "Shipping Address Updated",
        description: "Order shipping address was updated",
        actor: "admin",
        actorId: mockAdminId,
        timestamp: expect.any(Date),
        metadata: {
          addressType: "shipping",
          addressId: updatedAddress.id,
        },
      });
      expect(logger.info).toHaveBeenCalled();
    });

    it("should update billing address successfully", async () => {
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
              limit: jest.fn().mockResolvedValue([mockOrder]),
            }),
          }),
        });

      const updatedAddress = {
        ...mockAddress,
        id: mockBillingAddressId,
        ...validAddressData,
      };

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedAddress]),
          }),
        }),
      });

      // Act
      const result = await service.updateAddress(
        mockOrderId,
        "billing",
        validAddressData,
        mockAdminId,
      );

      // Assert
      expect(result).toEqual(mockOrder);
      expect(timelineService.addEvent).toHaveBeenCalledWith(mockOrderId, {
        type: "address_updated",
        title: "Billing Address Updated",
        description: "Order billing address was updated",
        actor: "admin",
        actorId: mockAdminId,
        timestamp: expect.any(Date),
        metadata: {
          addressType: "billing",
          addressId: updatedAddress.id,
        },
      });
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
        service.updateAddress(
          mockOrderId,
          "shipping",
          validAddressData,
          mockAdminId,
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateAddress(
          mockOrderId,
          "shipping",
          validAddressData,
          mockAdminId,
        ),
      ).rejects.toThrow(`Order with ID ${mockOrderId} not found`);
    });

    it("should throw BadRequestException when required field is missing", async () => {
      // Arrange
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      });

      const incompleteData = {
        street: "123 Main St",
        // Missing city, state, pincode, country
      };

      // Act & Assert
      await expect(
        service.updateAddress(
          mockOrderId,
          "shipping",
          incompleteData,
          mockAdminId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException when PIN code format is invalid", async () => {
      // Arrange
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOrder]),
          }),
        }),
      });

      const invalidPincodeData = {
        ...validAddressData,
        pincode: "12345", // Invalid: not 6 digits
      };

      // Act & Assert
      await expect(
        service.updateAddress(
          mockOrderId,
          "shipping",
          invalidPincodeData,
          mockAdminId,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateAddress(
          mockOrderId,
          "shipping",
          invalidPincodeData,
          mockAdminId,
        ),
      ).rejects.toThrow("PIN code must be exactly 6 digits");
    });

    it("should throw NotFoundException when address does not exist", async () => {
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
              limit: jest.fn().mockResolvedValue([mockOrder]),
            }),
          }),
        });

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Act & Assert
      await expect(
        service.updateAddress(
          mockOrderId,
          "shipping",
          validAddressData,
          mockAdminId,
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateAddress(
          mockOrderId,
          "shipping",
          validAddressData,
          mockAdminId,
        ),
      ).rejects.toThrow("Address not found");
    });
  });
});

