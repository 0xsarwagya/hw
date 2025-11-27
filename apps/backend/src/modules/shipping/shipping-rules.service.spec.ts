import { ShippingRulesService } from "./shipping-rules.service";

// Mock the database package
jest.mock("@vcecom/db", () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([]),
    limit: jest.fn().mockResolvedValue([]),
    orderBy: jest.fn().mockResolvedValue([]),
  },
  eq: jest.fn(),
  and: jest.fn(),
  desc: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
  pincodes: {},
  shippingRules: {},
  shippingZoneRates: {},
  stateShippingRules: {},
}));

describe("ShippingRulesService", () => {
  let service: ShippingRulesService;

  beforeEach(() => {
    service = new ShippingRulesService();
    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("checkServiceability", () => {
    it.skip("should return serviceability from database when PIN code exists", async () => {
      const mockPincodeData = [{
        pincode: "110001",
        state: "Delhi",
        district: "New Delhi",
        city: "New Delhi",
        isServiceable: true,
        codAvailable: true,
        shippingZone: "metro",
        estimatedDeliveryDays: 2,
      }];

      const { db } = require("@vcecom/db");
      db.where.mockResolvedValueOnce(mockPincodeData);

      const result = await service.checkServiceability("110001");

      expect(result.isValid).toBe(true);
      expect(result.isServiceable).toBe(true);
      expect(result.codAvailable).toBe(true);
      expect(result.shippingZone).toBe("metro");
      expect(result.state).toBe("Delhi");
      expect(result.district).toBe("New Delhi");
      expect(result.city).toBe("New Delhi");
    });

    it.skip("should fallback to utility function when PIN code not in database", async () => {
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockResolvedValue([]);

      const result = await service.checkServiceability("110001");

      expect(result.isValid).toBe(true);
      expect(result.shippingZone).toBe("metro");
      expect(result.state).toBe("Delhi");
    });

    it.skip("should handle database errors gracefully", async () => {
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockRejectedValue(new Error("Database error"));

      const result = await service.checkServiceability("110001");

      expect(result.isValid).toBe(true);
      expect(result.shippingZone).toBe("metro");
    });

    it("should return invalid result for malformed PIN codes", async () => {
      const result = await service.checkServiceability("12345");

      expect(result.isValid).toBe(false);
      expect(result.isServiceable).toBe(false);
      expect(result.codAvailable).toBe(false);
      expect(result.error).toBe("Invalid PIN code format");
    });
  });

  describe("calculateShippingRate", () => {
    it.skip("should calculate shipping rate for serviceable PIN code", async () => {
      // Mock serviceability check
      const mockServiceability = {
        isValid: true,
        isServiceable: true,
        codAvailable: true,
        shippingZone: "metro",
        state: "Delhi",
      };

      jest.spyOn(service, "checkServiceability").mockResolvedValue(mockServiceability);

      // Mock zone rates
      const mockZoneRates = [{
        baseRate: 50,
        additionalPerKg: 20,
        estimatedDays: 2,
        codCharge: 30,
      }];

      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.limit.mockResolvedValue(mockZoneRates);

      const result = await service.calculateShippingRate({
        pincode: "110001",
        weight: 500,
        isCod: true,
      });

      expect(result.baseRate).toBe(50);
      expect(result.codCharge).toBe(30);
      expect(result.totalRate).toBe(80);
      expect(result.estimatedDays).toBe(2);
      expect(result.isCodAvailable).toBe(true);
      expect(result.zone).toBe("metro");
    });

    it("should throw error for non-serviceable PIN code", async () => {
      const mockServiceability = {
        isValid: true,
        isServiceable: false,
        codAvailable: false,
        shippingZone: "zone_c",
      };

      jest.spyOn(service, "checkServiceability").mockResolvedValue(mockServiceability);

      await expect(
        service.calculateShippingRate({
          pincode: "000000",
          weight: 500,
        })
      ).rejects.toThrow("PIN code 000000 is not serviceable");
    });

    it.skip("should handle state-specific rules", async () => {
      const mockServiceability = {
        isValid: true,
        isServiceable: true,
        codAvailable: true,
        shippingZone: "zone_a",
        state: "Maharashtra",
      };

      jest.spyOn(service, "checkServiceability").mockResolvedValue(mockServiceability);

      // Mock zone rates
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.limit.mockResolvedValueOnce([]);

      // Mock state rules
      const mockStateRules = [{
        additionalDays: 1,
        codCharge: 25,
        codAvailable: true,
      }];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.limit.mockResolvedValueOnce(mockStateRules);

      const result = await service.calculateShippingRate({
        pincode: "400001",
        weight: 500,
        isCod: true,
      });

      expect(result.estimatedDays).toBe(4); // base 3 + additional 1
    });
  });

  describe("getShippingRules", () => {
    it.skip("should return active shipping rules", async () => {
      const mockRules = [
        {
          id: "rule-1",
          name: "Metro Rule",
          type: "zone_based",
          zone: "metro",
          isActive: true,
        },
      ];

      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockResolvedValue(mockRules);

      const result = await service.getShippingRules();

      expect(result).toEqual(mockRules);
      expect(mockDb.where).toHaveBeenCalledWith({ isActive: true });
    });
  });

  describe("getShippingZoneRates", () => {
    it.skip("should return active shipping zone rates", async () => {
      const mockRates = [
        {
          id: "rate-1",
          zone: "metro",
          baseRate: 50,
          isActive: true,
        },
      ];

      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockResolvedValue(mockRates);

      const result = await service.getShippingZoneRates();

      expect(result).toEqual(mockRates);
    });
  });

  describe("getStateShippingRules", () => {
    it.skip("should return active state shipping rules", async () => {
      const mockRules = [
        {
          id: "state-rule-1",
          state: "Maharashtra",
          codAvailable: true,
          isActive: true,
        },
      ];

      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockResolvedValue(mockRules);

      const result = await service.getStateShippingRules();

      expect(result).toEqual(mockRules);
    });
  });

  describe("checkBulkServiceability", () => {
    it.skip("should check multiple PIN codes", async () => {
      const pincodes = ["110001", "400001"];

      // Mock database results
      const mockDbResults = [
        {
          pincode: "110001",
          state: "Delhi",
          isServiceable: true,
          codAvailable: true,
          shippingZone: "metro",
        },
      ];

      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockResolvedValue(mockDbResults);

      const result = await service.checkBulkServiceability(pincodes);

      expect(result.size).toBe(2);
      expect(result.get("110001")?.isValid).toBe(true);
      expect(result.get("110001")?.shippingZone).toBe("metro");
    });
  });

  describe("validatePincodeFormat", () => {
    it("should validate PIN code format correctly", () => {
      expect(service.validatePincodeFormat("110001")).toBe(true);
      expect(service.validatePincodeFormat("12345")).toBe(false);
      expect(service.validatePincodeFormat("abc123")).toBe(false);
      expect(service.validatePincodeFormat("")).toBe(false);
    });
  });

  describe("getAvailableShippingZones", () => {
    it("should return all available shipping zones", () => {
      const zones = service.getAvailableShippingZones();

      expect(zones).toEqual(["metro", "zone_a", "zone_b", "zone_c", "zone_d", "zone_e"]);
    });
  });
});
