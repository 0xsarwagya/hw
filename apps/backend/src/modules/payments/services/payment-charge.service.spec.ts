import { Test, TestingModule } from "@nestjs/testing";
import { PinoLogger } from "nestjs-pino";
import { db, paymentMethodCharges } from "@vcecom/db";
import { PaymentChargeService } from "./payment-charge.service";
import { getCommonTestProviders } from "../../../common/testing/test-helpers";

// Mock database
jest.mock("@vcecom/db", () => ({
    select: jest.fn(),
  },
  eq: jest.fn((field, value) => ({ field, value })),
  and: jest.fn((...conditions) => conditions),
  inArray: jest.fn((field, values) => ({ field, values })),
  productVariants: {
    id: "id",
    productId: "product_id",
  },
  products: {
    id: "id",
    isDigital: "is_digital",
    isPreorder: "is_preorder",
  },
  paymentMethodCharges: {
    method: "method",
    currency: "currency",
    active: "active",
  },
}));

describe("PaymentChargeService", () => {
  let service: PaymentChargeService;
  let mockLogger: jest.Mocked<PinoLogger>;

  beforeEach(async () => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      logger: {
        level: "info",
        child: jest.fn().mockReturnThis(),
      },
    } as unknown as jest.Mocked<PinoLogger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentChargeService,
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<PaymentChargeService>(PaymentChargeService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("calculateFee", () => {
    describe("FLAT charge type", () => {
      it("should calculate flat fee correctly", async () => {
        const mockChargeConfig = {
          id: "charge-1",
          method: "COD",
          chargeType: "FLAT",
          flatAmount: 3000, // ₹30
          percentage: 0,
          mixCap: null,
          mixMin: null,
          isTaxable: false,
          currency: "INR",
          codMaxAmount: null,
          codDisallowHighValue: false,
          codDisallowDigital: true,
          codDisallowPreorder: true,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (db.select as jest.Mock).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockChargeConfig]),
            }),
          }),
        });

        const result = await service.calculateFee("COD", 100000, "INR");

        expect(result.fee).toBe(3000);
        expect(result.breakdown.chargeType).toBe("FLAT");
        expect(result.breakdown.flatAmount).toBe(3000);
        expect(result.breakdown.calculatedFee).toBe(3000);
      });
    });

    describe("PERCENTAGE charge type", () => {
      it("should calculate percentage fee correctly", async () => {
        const mockChargeConfig = {
          id: "charge-2",
          method: "RAZORPAY_CARD",
          chargeType: "PERCENTAGE",
          flatAmount: 0,
          percentage: 2.0,
          mixCap: null,
          mixMin: null,
          isTaxable: false,
          currency: "INR",
          codMaxAmount: null,
          codDisallowHighValue: false,
          codDisallowDigital: false,
          codDisallowPreorder: false,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (db.select as jest.Mock).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockChargeConfig]),
            }),
          }),
        });

        const cartTotal = 100000; // ₹1000 in paise
        const result = await service.calculateFee(
          "RAZORPAY_CARD",
          cartTotal,
          "INR",
        );

        expect(result.fee).toBe(2000); // 2% of ₹1000 = ₹20 = 2000 paise
        expect(result.breakdown.chargeType).toBe("PERCENTAGE");
        expect(result.breakdown.percentage).toBe(2.0);
        expect(result.breakdown.calculatedFee).toBe(2000);
      });

      it("should round percentage fee correctly", async () => {
        const mockChargeConfig = {
          id: "charge-3",
          method: "WALLET",
          chargeType: "PERCENTAGE",
          flatAmount: 0,
          percentage: 1.5,
          mixCap: null,
          mixMin: null,
          isTaxable: false,
          currency: "INR",
          codMaxAmount: null,
          codDisallowHighValue: false,
          codDisallowDigital: false,
          codDisallowPreorder: false,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (db.select as jest.Mock).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockChargeConfig]),
            }),
          }),
        });

        const cartTotal = 33333; // ₹333.33 in paise
        const result = await service.calculateFee("WALLET", cartTotal, "INR");

        // 1.5% of 33333 = 499.995, should round to 500
        expect(result.fee).toBe(500);
        expect(result.breakdown.percentage).toBe(1.5);
      });
    });

    describe("MIXED charge type", () => {
      it("should calculate mixed fee with percentage and flat", async () => {
        const mockChargeConfig = {
          id: "charge-4",
          method: "STRIPE_CARD",
          chargeType: "MIXED",
          flatAmount: 200, // ₹2
          percentage: 2.9,
          mixCap: null,
          mixMin: null,
          isTaxable: false,
          currency: "INR",
          codMaxAmount: null,
          codDisallowHighValue: false,
          codDisallowDigital: false,
          codDisallowPreorder: false,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (db.select as jest.Mock).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockChargeConfig]),
            }),
          }),
        });

        const cartTotal = 100000; // ₹1000 in paise
        const result = await service.calculateFee(
          "STRIPE_CARD",
          cartTotal,
          "INR",
        );

        // 2.9% of ₹1000 = ₹29 = 2900 paise
        // Plus flat ₹2 = 200 paise
        // Total = 3100 paise
        expect(result.fee).toBe(3100);
        expect(result.breakdown.chargeType).toBe("MIXED");
        expect(result.breakdown.percentage).toBe(2.9);
        expect(result.breakdown.flatAmount).toBe(200);
        expect(result.breakdown.calculatedFee).toBe(3100);
      });

      it("should apply minimum cap for mixed fee", async () => {
        const mockChargeConfig = {
          id: "charge-5",
          method: "STRIPE_CARD",
          chargeType: "MIXED",
          flatAmount: 200,
          percentage: 2.9,
          mixCap: null,
          mixMin: 1000, // Minimum ₹10
          isTaxable: false,
          currency: "INR",
          codMaxAmount: null,
          codDisallowHighValue: false,
          codDisallowDigital: false,
          codDisallowPreorder: false,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (db.select as jest.Mock).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockChargeConfig]),
            }),
          }),
        });

        const cartTotal = 10000; // ₹100 in paise
        const result = await service.calculateFee(
          "STRIPE_CARD",
          cartTotal,
          "INR",
        );

        // 2.9% of ₹100 = ₹2.9 = 290 paise
        // But minimum is ₹10 = 1000 paise
        // Plus flat ₹2 = 200 paise
        // Total = 1200 paise
        expect(result.fee).toBe(1200);
        expect(result.breakdown.mixMin).toBe(1000);
      });

      it("should apply maximum cap for mixed fee", async () => {
        const mockChargeConfig = {
          id: "charge-6",
          method: "STRIPE_CARD",
          chargeType: "MIXED",
          flatAmount: 200,
          percentage: 2.9,
          mixCap: 5000, // Maximum ₹50
          mixMin: null,
          isTaxable: false,
          currency: "INR",
          codMaxAmount: null,
          codDisallowHighValue: false,
          codDisallowDigital: false,
          codDisallowPreorder: false,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (db.select as jest.Mock).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockChargeConfig]),
            }),
          }),
        });

        const cartTotal = 500000; // ₹5000 in paise
        const result = await service.calculateFee(
          "STRIPE_CARD",
          cartTotal,
          "INR",
        );

        // 2.9% of ₹5000 = ₹145 = 14500 paise
        // But cap is ₹50 = 5000 paise
        // Plus flat ₹2 = 200 paise
        // Total = 5200 paise
        expect(result.fee).toBe(5200);
        expect(result.breakdown.mixCap).toBe(5000);
      });

      it("should apply both minimum and maximum caps for mixed fee", async () => {
        const mockChargeConfig = {
          id: "charge-7",
          method: "STRIPE_CARD",
          chargeType: "MIXED",
          flatAmount: 200,
          percentage: 2.9,
          mixCap: 5000, // Maximum ₹50
          mixMin: 1000, // Minimum ₹10
          isTaxable: false,
          currency: "INR",
          codMaxAmount: null,
          codDisallowHighValue: false,
          codDisallowDigital: false,
          codDisallowPreorder: false,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (db.select as jest.Mock).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockChargeConfig]),
            }),
          }),
        });

        // Test with low amount (should apply minimum)
        const lowCartTotal = 10000; // ₹100
        const lowResult = await service.calculateFee(
          "STRIPE_CARD",
          lowCartTotal,
          "INR",
        );
        expect(lowResult.fee).toBe(1200); // min 1000 + flat 200

        // Test with high amount (should apply maximum)
        const highCartTotal = 500000; // ₹5000
        const highResult = await service.calculateFee(
          "STRIPE_CARD",
          highCartTotal,
          "INR",
        );
        expect(highResult.fee).toBe(5200); // cap 5000 + flat 200

        // Test with medium amount (should use percentage)
        const mediumCartTotal = 100000; // ₹1000
        const mediumResult = await service.calculateFee(
          "STRIPE_CARD",
          mediumCartTotal,
          "INR",
        );
        expect(mediumResult.fee).toBe(3100); // 2.9% = 2900 + flat 200
      });
    });

    describe("Edge cases", () => {
      it("should return zero fee when no charge config found", async () => {
        (db.select as jest.Mock).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        });

        const result = await service.calculateFee("UNKNOWN_METHOD", 100000, "INR");

        expect(result.fee).toBe(0);
        expect(result.breakdown.calculatedFee).toBe(0);
        expect(mockLogger.warn).toHaveBeenCalled();
      });

      it("should fallback to INR when currency config not found", async () => {
        const mockChargeConfig = {
          id: "charge-8",
          method: "COD",
          chargeType: "FLAT",
          flatAmount: 3000,
          percentage: 0,
          mixCap: null,
          mixMin: null,
          isTaxable: false,
          currency: "INR",
          codMaxAmount: null,
          codDisallowHighValue: false,
          codDisallowDigital: true,
          codDisallowPreorder: true,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // First call returns empty (USD not found)
        // Second call returns INR config
        (db.select as jest.Mock)
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
                limit: jest.fn().mockResolvedValue([mockChargeConfig]),
              }),
            }),
          });

        const result = await service.calculateFee("COD", 100000, "USD");

        expect(result.fee).toBe(3000);
        expect(db.select).toHaveBeenCalledTimes(2);
      });

      it("should ensure fee is non-negative", async () => {
        const mockChargeConfig = {
          id: "charge-9",
          method: "TEST",
          chargeType: "PERCENTAGE",
          flatAmount: 0,
          percentage: -5, // Negative percentage (edge case)
          mixCap: null,
          mixMin: null,
          isTaxable: false,
          currency: "INR",
          codMaxAmount: null,
          codDisallowHighValue: false,
          codDisallowDigital: false,
          codDisallowPreorder: false,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (db.select as jest.Mock).mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockChargeConfig]),
            }),
          }),
        });

        const result = await service.calculateFee("TEST", 100000, "INR");

        expect(result.fee).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("getAvailableMethods", () => {
    it("should return all available payment methods with fees", async () => {
      const mockChargeConfigs = [
        {
          id: "charge-1",
          method: "COD",
          chargeType: "FLAT",
          flatAmount: 3000,
          percentage: 0,
          mixCap: null,
          mixMin: null,
          isTaxable: false,
          currency: "INR",
          codMaxAmount: null,
          codDisallowHighValue: false,
          codDisallowDigital: true,
          codDisallowPreorder: true,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "charge-2",
          method: "RAZORPAY_UPI",
          chargeType: "PERCENTAGE",
          flatAmount: 0,
          percentage: 0,
          mixCap: null,
          mixMin: null,
          isTaxable: false,
          currency: "INR",
          codMaxAmount: null,
          codDisallowHighValue: false,
          codDisallowDigital: false,
          codDisallowPreorder: false,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "charge-3",
          method: "RAZORPAY_CARD",
          chargeType: "PERCENTAGE",
          flatAmount: 0,
          percentage: 2.0,
          mixCap: null,
          mixMin: null,
          isTaxable: false,
          currency: "INR",
          codMaxAmount: null,
          codDisallowHighValue: false,
          codDisallowDigital: false,
          codDisallowPreorder: false,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock for getAvailableMethods (selects all active configs)
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockChargeConfigs),
        }),
      });

      // Mock for calculateFee calls (one per method)
      mockChargeConfigs.forEach((config) => {
        (db.select as jest.Mock).mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([config]),
            }),
          }),
        });
      });

      const result = await service.getAvailableMethods(100000, "INR", []);

      expect(result).toHaveLength(3);
      expect(result[0].method).toBe("COD");
      expect(result[0].fee).toBe(3000);
      expect(result[0].label).toBe("Cash on Delivery");
      expect(result[0].available).toBe(true);

      expect(result[1].method).toBe("RAZORPAY_UPI");
      expect(result[1].fee).toBe(0);
      expect(result[1].label).toBe("UPI");

      expect(result[2].method).toBe("RAZORPAY_CARD");
      expect(result[2].fee).toBe(2000);
      expect(result[2].label).toBe("Card (Razorpay)");
    });

    it("should filter out inactive payment methods", async () => {
      const mockChargeConfigs = [
        {
          id: "charge-1",
          method: "COD",
          chargeType: "FLAT",
          flatAmount: 3000,
          percentage: 0,
          mixCap: null,
          mixMin: null,
          isTaxable: false,
          currency: "INR",
          codMaxAmount: null,
          codDisallowHighValue: false,
          codDisallowDigital: true,
          codDisallowPreorder: true,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockChargeConfigs),
        }),
      });

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockChargeConfigs[0]]),
          }),
        }),
      });

      const result = await service.getAvailableMethods(100000, "INR", []);

      expect(result).toHaveLength(1);
      expect(result[0].method).toBe("COD");
    });
  });

  describe("validateCodEligibility", () => {
    it("should allow COD when cart total is below max amount", async () => {
      const mockChargeConfig = {
        id: "charge-1",
        method: "COD",
        chargeType: "FLAT",
        flatAmount: 3000,
        percentage: 0,
        mixCap: null,
        mixMin: null,
        isTaxable: false,
        currency: "INR",
        codMaxAmount: 500000, // ₹5000 max
        codDisallowHighValue: false,
        codDisallowDigital: true,
        codDisallowPreorder: true,
        codDisallowInternational: true,
        codRestrictedStates: null,
        codAllowedCustomerGroups: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const cartTotal = 100000; // ₹1000
      const cartItems: any[] = [];

      // Mock database select to return empty array (no digital/preorder products)
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.validateCodEligibility(
        cartTotal,
        cartItems,
        mockChargeConfig,
      );

      expect(result.eligible).toBe(true);
    });

    it("should disallow COD when cart total exceeds max amount", async () => {
      const mockChargeConfig = {
        id: "charge-1",
        method: "COD",
        chargeType: "FLAT",
        flatAmount: 3000,
        percentage: 0,
        mixCap: null,
        mixMin: null,
        isTaxable: false,
        currency: "INR",
        codMaxAmount: 500000, // ₹5000 max
        codDisallowHighValue: false,
        codDisallowDigital: true,
        codDisallowPreorder: true,
        codDisallowInternational: true,
        codRestrictedStates: null,
        codAllowedCustomerGroups: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const cartTotal = 600000; // ₹6000 - exceeds max
      const cartItems: any[] = [];

      // Mock database select to return empty array (no digital/preorder products)
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.validateCodEligibility(
        cartTotal,
        cartItems,
        mockChargeConfig,
      );

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("COD not available for orders above");
    });

    it("should allow COD when max amount is not set", async () => {
      const mockChargeConfig = {
        id: "charge-1",
        method: "COD",
        chargeType: "FLAT",
        flatAmount: 3000,
        percentage: 0,
        mixCap: null,
        mixMin: null,
        isTaxable: false,
        currency: "INR",
        codMaxAmount: null, // No max limit
        codDisallowHighValue: false,
        codDisallowDigital: true,
        codDisallowPreorder: true,
        codDisallowInternational: true,
        codRestrictedStates: null,
        codAllowedCustomerGroups: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const cartTotal = 1000000; // ₹10000
      const cartItems: any[] = [];

      // Mock database select to return empty array (no digital/preorder products)
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.validateCodEligibility(
        cartTotal,
        cartItems,
        mockChargeConfig,
      );

      expect(result.eligible).toBe(true);
    });
  });
});

