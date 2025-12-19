import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { addresses, customers, db, eq } from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../common/logging/context.service";
import { getCommonTestProviders } from "../../common/testing/test-helpers";
import { AddressesService } from "./addresses.service";
import { CreateAddressDto } from "./dto/create-address.dto";

// Mock @vcecom/db
jest.mock("@vcecom/db", () => {
  const mockDb = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  return {
    db: mockDb,
    addresses: {},
    customers: {},
    eq: jest.fn(),
    and: jest.fn(),
  };
});

describe("AddressesService", () => {
  let service: AddressesService;

  const mockCustomerId = "customer-123";
  const mockUserId = "user-123";
  const mockAddressId = "address-123";

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddressesService, ...getCommonTestProviders()],
    }).compile();

    service = module.get<AddressesService>(AddressesService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("createByCustomerId", () => {
    const createAddressDto: CreateAddressDto = {
      type: "shipping",
      street: "123 Main St",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      district: "Mumbai",
      country: "India",
    };

    it("should create address for customer", async () => {
      // Arrange
      const mockAddress = {
        id: mockAddressId,
        customerId: mockCustomerId,
        ...createAddressDto,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock: update existing default addresses (if any)
      (db.update as jest.Mock).mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      // Mock: insert address
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockAddress]),
        }),
      });

      // Act
      const result = await service.createByCustomerId(
        mockCustomerId,
        createAddressDto,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.customerId).toBe(mockCustomerId);
      expect(result.street).toBe(createAddressDto.street);
      expect(db.insert).toHaveBeenCalled();
    });

    it("should throw error for invalid pincode format", async () => {
      const invalidDto = {
        ...createAddressDto,
        pincode: "12345", // Invalid - should be 6 digits
      };

      await expect(
        service.createByCustomerId(mockCustomerId, invalidDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createByCustomerId(mockCustomerId, invalidDto),
      ).rejects.toThrow("Invalid PIN code format");
    });

    it("should unset other default addresses when creating new default", async () => {
      const defaultDto = {
        ...createAddressDto,
        type: "shipping" as const,
      };

      // Mock: update existing default addresses
      (db.update as jest.Mock).mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      // Mock: insert address
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: mockAddressId,
              customerId: mockCustomerId,
              ...defaultDto,
              isDefault: false,
            },
          ]),
        }),
      });

      await service.createByCustomerId(mockCustomerId, defaultDto);

      expect(db.update).toHaveBeenCalled(); // Should unset other defaults
    });
  });
});

