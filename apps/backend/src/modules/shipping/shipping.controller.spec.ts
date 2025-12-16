import { Test, TestingModule } from "@nestjs/testing";
import { ShippingController } from "./shipping.controller";
import { ShippingRulesService } from "./shipping-rules.service";
import { ShiprocketService } from "./shiprocket.service";
import { NimbusPostService } from "./nimbus-post.service";

// Mock the database globally
jest.mock("@vcecom/db", () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([]),
    limit: jest.fn().mockResolvedValue([]),
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

describe("ShippingController", () => {
  let controller: ShippingController;
  let service: jest.Mocked<ShippingRulesService>;

  beforeEach(async () => {
    const mockShippingRulesService = {
      checkServiceability: jest.fn(),
      calculateShippingRate: jest.fn(),
      checkBulkServiceability: jest.fn(),
      getShippingRules: jest.fn(),
      getShippingZoneRates: jest.fn(),
      getStateShippingRules: jest.fn(),
      getAvailableShippingZones: jest.fn(),
    };

    const mockShiprocketService = {
      // Add minimal mock methods if needed
    };

    const mockNimbusPostService = {
      // Add minimal mock methods if needed
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShippingController],
      providers: [
        {
          provide: ShippingRulesService,
          useValue: mockShippingRulesService,
        },
        {
          provide: ShiprocketService,
          useValue: mockShiprocketService,
        },
        {
          provide: NimbusPostService,
          useValue: mockNimbusPostService,
        },
      ],
    }).compile();

    controller = module.get<ShippingController>(ShippingController);
    service = module.get(ShippingRulesService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("checkServiceability", () => {
    it("should check PIN code serviceability", async () => {
      const mockDto = { pincode: "110001" };
      const mockResult = {
        isValid: true,
        isServiceable: true,
        codAvailable: true,
        shippingZone: "metro",
        state: "Delhi",
        district: "New Delhi",
        city: "New Delhi",
        estimatedDeliveryDays: 2,
      };

      service.checkServiceability.mockResolvedValue(mockResult);

      const result = await controller.checkServiceability(mockDto);

      expect(service.checkServiceability).toHaveBeenCalledWith("110001");
      expect(result).toEqual(mockResult);
    });
  });

  describe("calculateShippingRate", () => {
    it("should calculate shipping rate", async () => {
      const mockRequest = {
        pincode: "110001",
        weight: 500,
        isCod: false,
      };

      const mockResult = {
        baseRate: 50,
        additionalCharges: 10,
        codCharge: 0,
        totalRate: 60,
        estimatedDays: 2,
        isCodAvailable: false,
        zone: "metro",
      };

      service.calculateShippingRate.mockResolvedValue(mockResult);

      const result = await controller.calculateShippingRate(mockRequest);

      expect(service.calculateShippingRate).toHaveBeenCalledWith(mockRequest);
      expect(result).toEqual(mockResult);
    });
  });

  describe("checkBulkServiceability", () => {
    it("should check multiple PIN codes", async () => {
      const mockDto = { pincodes: ["110001"] };
      const mockResult = new Map([
        ["110001", {
          isValid: true,
          isServiceable: true,
          codAvailable: true,
          shippingZone: "metro",
          state: "Delhi",
          district: "New Delhi",
          city: "New Delhi",
          estimatedDeliveryDays: 2,
        }],
      ]);

      service.checkBulkServiceability.mockResolvedValue(mockResult);

      const result = await controller.checkBulkServiceability(mockDto);

      expect(service.checkBulkServiceability).toHaveBeenCalledWith(["110001"]);
      expect(result).toEqual({ results: Object.fromEntries(mockResult) });
    });
  });

  describe("getShippingRules", () => {
    it("should return shipping rules", async () => {
      const mockRules = [{
        id: "rule-1",
        name: "Metro Rule",
        type: "zone_based",
        zone: "metro",
        isActive: true,
      }];

      service.getShippingRules.mockResolvedValue(mockRules);

      const result = await controller.getShippingRules();

      expect(service.getShippingRules).toHaveBeenCalled();
      expect(result).toEqual(mockRules);
    });
  });

  describe("getShippingZoneRates", () => {
    it("should return shipping zone rates", async () => {
      const mockRates = [{
        id: "rate-1",
        zone: "metro",
        baseRate: 50,
        isActive: true,
      }];

      service.getShippingZoneRates.mockResolvedValue(mockRates);

      const result = await controller.getShippingZoneRates();

      expect(service.getShippingZoneRates).toHaveBeenCalled();
      expect(result).toEqual(mockRates);
    });
  });

  describe("getStateShippingRules", () => {
    it("should return state shipping rules", async () => {
      const mockRules = [{
        id: "state-rule-1",
        state: "Maharashtra",
        codAvailable: true,
        isActive: true,
      }];

      service.getStateShippingRules.mockResolvedValue(mockRules);

      const result = await controller.getStateShippingRules();

      expect(service.getStateShippingRules).toHaveBeenCalled();
      expect(result).toEqual(mockRules);
    });
  });

});
