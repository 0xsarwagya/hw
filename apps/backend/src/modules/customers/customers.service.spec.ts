import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { customers, db, eq, users } from "@vcecom/db";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../common/logging/context.service";
import { getCommonTestProviders } from "../../common/testing/test-helpers";
import { CustomersService } from "./customers.service";

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn((password: string) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn((password: string, hash: string) =>
    Promise.resolve(hash === `hashed_${password}`),
  ),
}));

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
    customers: {},
    users: {},
    eq: jest.fn(),
  };
});

describe("CustomersService", () => {
  let service: CustomersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn((payload: any) => `token_${payload.sub}`),
          },
        },
        ...getCommonTestProviders(),
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("createGuestCustomer", () => {
    const email = "guest@example.com";
    const name = "Guest User";
    const phone = "+919876543210";

    it("should create a guest customer when no password is provided", async () => {
      // Mock: no existing customer
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Mock: user insert
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: "user-123",
              email,
              passwordHash: null,
              role: "customer",
            },
          ]),
        }),
      });

      // Mock: customer insert (second call to db.insert)
      (db.insert as jest.Mock)
        .mockReturnValueOnce({
          // First call: user insert
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: "user-123",
                email,
                passwordHash: null,
                role: "customer",
              },
            ]),
          }),
        })
        .mockReturnValueOnce({
          // Second call: customer insert
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: "customer-123",
                userId: "user-123",
                email,
                phone,
                name,
                isGuest: true,
                emailVerified: false,
              },
            ]),
          }),
        });

      const result = await service.createGuestCustomer(email, name, phone, null);

      expect(result).toBeDefined();
      expect(result.isGuest).toBe(true);
      expect(result.emailVerified).toBe(false);
      expect(db.insert).toHaveBeenCalledTimes(2); // user and customer
    });

    it("should create an account customer when password is provided", async () => {
      const password = "SecurePassword123!";

      // Mock: no existing customer
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Mock: user insert (first call) and customer insert (second call)
      (db.insert as jest.Mock)
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: "user-123",
                email,
                passwordHash: "hashed_SecurePassword123!",
                role: "customer",
              },
            ]),
          }),
        })
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                id: "customer-123",
                userId: "user-123",
                email,
                phone,
                name,
                isGuest: false,
                emailVerified: true,
              },
            ]),
          }),
        });

      const result = await service.createGuestCustomer(
        email,
        name,
        phone,
        password,
      );

      expect(result).toBeDefined();
      expect(result.isGuest).toBe(false);
      expect(result.emailVerified).toBe(true);
    });

    it("should return existing guest customer if email already exists as guest", async () => {
      const existingGuest = {
        id: "customer-123",
        userId: "user-123",
        email,
        phone,
        name,
        isGuest: true,
        emailVerified: false,
      };

      // Mock: existing guest customer found
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([existingGuest]),
          }),
        }),
      });

      const result = await service.createGuestCustomer(email, name, phone, null);

      expect(result).toEqual(existingGuest);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it("should throw error if email already exists as registered customer", async () => {
      const existingCustomer = {
        id: "customer-123",
        userId: "user-123",
        email,
        phone,
        name,
        isGuest: false,
        emailVerified: true,
      };

      // Mock: existing registered customer found
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([existingCustomer]),
          }),
        }),
      });

      await expect(
        service.createGuestCustomer(email, name, phone, null),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createGuestCustomer(email, name, phone, null),
      ).rejects.toThrow("Email already registered. Please login to continue.");
    });

    it("should throw error if phone already exists", async () => {
      // Mock for first call: no customer by email, no user by email, existing customer by phone
      // Mock for second call: same sequence
      (db.select as jest.Mock)
        // First call mocks
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
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([
                { id: "existing-customer", phone },
              ]),
            }),
          }),
        })
        // Second call mocks
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
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([
                { id: "existing-customer", phone },
              ]),
            }),
          }),
        });

      await expect(
        service.createGuestCustomer(email, name, phone, null),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createGuestCustomer(email, name, phone, null),
      ).rejects.toThrow("Customer with this phone number already exists");
    });

    it("should throw error if email format is invalid", async () => {
      await expect(
        service.createGuestCustomer("invalid-email", name, phone, null),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createGuestCustomer("invalid-email", name, phone, null),
      ).rejects.toThrow("Invalid email format");
    });

    it("should throw error if phone is not provided", async () => {
      // Mock: no existing customer by email
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        service.createGuestCustomer(email, name, undefined, null),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createGuestCustomer(email, name, undefined, null),
      ).rejects.toThrow("Phone is required for guest checkout");
    });
  });

  describe("claimAccount", () => {
    const email = "guest@example.com";
    const token = "verification-token";
    const newPassword = "NewPassword123!";

    it("should convert guest customer to account", async () => {
      const guestCustomer = {
        id: "customer-123",
        userId: "user-123",
        email,
        phone: "+919876543210",
        name: "Guest User",
        isGuest: true,
        emailVerified: false,
      };

      const user = {
        id: "user-123",
        email,
        passwordHash: null,
        role: "customer",
      };

      // Mock: find customer
      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([guestCustomer]),
            }),
          }),
        })
        // Mock: find user
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([user]),
            }),
          }),
        });

      // Mock: update user
      (db.update as jest.Mock).mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      // Mock: update customer
      (db.update as jest.Mock).mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                ...guestCustomer,
                isGuest: false,
                emailVerified: true,
              },
            ]),
          }),
        }),
      });

      const result = await service.claimAccount(email, token, newPassword);

      expect(result).toBeDefined();
      expect(result.isGuest).toBe(false);
      expect(result.emailVerified).toBe(true);
      expect(db.update).toHaveBeenCalledTimes(2); // user and customer
    });

    it("should throw error if customer not found", async () => {
      // Mock: customer not found
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        service.claimAccount(email, token, newPassword),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.claimAccount(email, token, newPassword),
      ).rejects.toThrow("Customer not found");
    });

    it("should throw error if customer is not a guest", async () => {
      const registeredCustomer = {
        id: "customer-123",
        userId: "user-123",
        email,
        phone: "+919876543210",
        name: "Registered User",
        isGuest: false,
        emailVerified: true,
      };

      // Mock: registered customer found
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([registeredCustomer]),
          }),
        }),
      });

      await expect(
        service.claimAccount(email, token, newPassword),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.claimAccount(email, token, newPassword),
      ).rejects.toThrow(
        "This email is already associated with an account",
      );
    });
  });
});

