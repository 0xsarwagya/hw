import { Test, TestingModule } from "@nestjs/testing";
import { NimbusPostService } from "./nimbus-post.service";
import { NimbusPostConfigService } from "./nimbus-post-config.service";
import { db, eq, orders, addresses, orderItems, shipments } from "@vcecom/db";

// Mock fetch globally
global.fetch = jest.fn();

// Mock database module
jest.mock("@vcecom/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
  eq: jest.fn(),
  orders: {},
  addresses: {},
  orderItems: {},
  shipments: {},
}));

describe("NimbusPostService", () => {
  let service: NimbusPostService;
  let configService: NimbusPostConfigService;

  const mockConfigService = {
    getBaseUrl: jest.fn(),
    authenticate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NimbusPostService,
        {
          provide: NimbusPostConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<NimbusPostService>(NimbusPostService);
    configService =
      module.get<NimbusPostConfigService>(NimbusPostConfigService);

    jest.clearAllMocks();
    mockConfigService.getBaseUrl.mockReturnValue(
      "https://api.nimbuspost.com/v1",
    );
  });

  describe("onModuleInit", () => {
    it("should store credentials from environment variables", () => {
      process.env.NIMBUS_POST_API_KEY = "test-api-key";
      process.env.NIMBUS_POST_API_SECRET = "test-api-secret";

      const newService = new NimbusPostService(configService);
      newService.onModuleInit();

      expect(newService.isInitialized()).toBe(true);
    });

    it("should not initialize when API key is missing", () => {
      delete process.env.NIMBUS_POST_API_KEY;
      process.env.NIMBUS_POST_API_SECRET = "test-api-secret";

      const newService = new NimbusPostService(configService);
      newService.onModuleInit();

      expect(newService.isInitialized()).toBe(false);
    });

    it("should not initialize when API secret is missing", () => {
      process.env.NIMBUS_POST_API_KEY = "test-api-key";
      delete process.env.NIMBUS_POST_API_SECRET;

      const newService = new NimbusPostService(configService);
      newService.onModuleInit();

      expect(newService.isInitialized()).toBe(false);
    });
  });

  describe("initialize", () => {
    it("should initialize with credentials and authenticate", async () => {
      mockConfigService.authenticate.mockResolvedValue({
        access_token: "test-token",
        expires_in: 3600,
      });

      await service.initialize("test-api-key", "test-api-secret");

      expect(service.isInitialized()).toBe(true);
      expect(mockConfigService.authenticate).toHaveBeenCalledWith({
        apiKey: "test-api-key",
        apiSecret: "test-api-secret",
        baseUrl: "https://api.nimbuspost.com/v1",
      });
    });

    it("should throw error when authenticate fails", async () => {
      mockConfigService.authenticate.mockRejectedValue(
        new Error("Authentication failed"),
      );

      await expect(
        service.initialize("invalid-key", "invalid-secret"),
      ).rejects.toThrow("Authentication failed");
    });
  });

  describe("authenticate", () => {
    it("should authenticate and store token", async () => {
      mockConfigService.authenticate.mockResolvedValue({
        access_token: "test-token",
        expires_in: 3600,
      });

      service.initialize("test-api-key", "test-api-secret");

      const token = await service.authenticate();

      expect(token).toBe("test-token");
      expect(mockConfigService.authenticate).toHaveBeenCalled();
    });

    it("should throw error when credentials not configured", async () => {
      const newService = new NimbusPostService(configService);

      await expect(newService.authenticate()).rejects.toThrow(
        "Nimbus Post credentials not configured",
      );
    });
  });

  describe("getAuthToken", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockConfigService.authenticate.mockReset();
      mockConfigService.authenticate.mockResolvedValue({
        access_token: "test-token",
        expires_in: 3600,
      });
      service.initialize("test-api-key", "test-api-secret");
    });

    it("should return existing token if not expired", async () => {
      const token1 = await service.getAuthToken();
      const token2 = await service.getAuthToken();

      expect(token1).toBe("test-token");
      expect(token2).toBe("test-token");
      // Should only authenticate once (during initialize)
      expect(mockConfigService.authenticate).toHaveBeenCalledTimes(1);
    });

    it("should refresh token if expired", async () => {
      jest.clearAllMocks();
      mockConfigService.authenticate
        .mockResolvedValueOnce({
          access_token: "token-1",
          expires_in: 60, // 1 minute
        })
        .mockResolvedValueOnce({
          access_token: "token-2",
          expires_in: 3600,
        });

      const newService = new NimbusPostService(configService);
      await newService.initialize("test-api-key", "test-api-secret");

      // Fast forward time to expire token
      const originalNow = Date.now();
      jest.spyOn(Date, "now").mockReturnValue(originalNow + 70 * 1000);

      const token = await newService.getAuthToken();

      expect(token).toBe("token-2");
      expect(mockConfigService.authenticate).toHaveBeenCalledTimes(2);

      jest.restoreAllMocks();
    });
  });

  describe("isInitialized", () => {
    it("should return false when not initialized", () => {
      const newService = new NimbusPostService(configService);
      expect(newService.isInitialized()).toBe(false);
    });

    it("should return true when initialized", () => {
      service.initialize("test-api-key", "test-api-secret");
      expect(service.isInitialized()).toBe(true);
    });
  });

  describe("testConnection", () => {
    it("should return success when initialized and authenticated", async () => {
      jest.clearAllMocks();
      mockConfigService.authenticate.mockResolvedValue({
        access_token: "test-token",
        expires_in: 3600,
      });

      const newService = new NimbusPostService(configService);
      await newService.initialize("test-api-key", "test-api-secret");

      const result = await newService.testConnection();

      expect(result).toEqual({
        success: true,
        message: "Nimbus Post API connection successful",
        authenticated: true,
      });
    });

    it("should return failure when not initialized", async () => {
      const newService = new NimbusPostService(configService);

      const result = await newService.testConnection();

      expect(result).toEqual({
        success: false,
        message: "Nimbus Post is not initialized",
        authenticated: false,
      });
    });

    it("should return failure when authentication fails", async () => {
      jest.clearAllMocks();
      // First authenticate succeeds to initialize the service
      mockConfigService.authenticate
        .mockResolvedValueOnce({
          access_token: "test-token",
          expires_in: 60, // Short expiry to force refresh
        })
        // Then authenticate fails when testConnection calls getAuthToken (which refreshes)
        .mockRejectedValueOnce(new Error("Auth failed"));

      const newService = new NimbusPostService(configService);
      await newService.initialize("test-api-key", "test-api-secret");

      // Fast forward time to expire token so getAuthToken will try to refresh
      const originalNow = Date.now();
      const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(originalNow + 70 * 1000);

      const result = await newService.testConnection();

      expect(result).toEqual({
        success: false,
        message: "Auth failed",
        authenticated: false,
      });

      dateNowSpy.mockRestore();
    });
  });

  describe("makeRequest", () => {
    beforeEach(() => {
      service.initialize("test-api-key", "test-api-secret");
    });

    it("should make authenticated request successfully", async () => {
      mockConfigService.authenticate.mockResolvedValue({
        access_token: "test-token",
        expires_in: 3600,
      });

      mockConfigService.getBaseUrl.mockReturnValue(
        "https://api.nimbuspost.com/v1",
      );

      const mockResponse = { data: "test" };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.makeRequest("/test-endpoint");

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.nimbuspost.com/v1/test-endpoint",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
        },
      );
    });

    it("should handle API errors", async () => {
      mockConfigService.authenticate.mockResolvedValue({
        access_token: "test-token",
        expires_in: 3600,
      });

      mockConfigService.getBaseUrl.mockReturnValue(
        "https://api.nimbuspost.com/v1",
      );

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Bad Request",
        json: async () => ({
          message: "Invalid request",
        }),
      });

      await expect(service.makeRequest("/test-endpoint")).rejects.toThrow(
        "Nimbus Post API request failed: Invalid request",
      );
    });
  });

  describe("calculateRates", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockConfigService.authenticate.mockResolvedValue({
        access_token: "test-token",
        expires_in: 3600,
      });
      service.initialize("test-api-key", "test-api-secret");
    });

    it("should calculate rates successfully", async () => {
      mockConfigService.getBaseUrl.mockReturnValue(
        "https://api.nimbuspost.com/v1",
      );

      const mockResponse = {
        data: {
          available_couriers: [
            {
              id: 1,
              courier_name: "BlueDart",
              rate: 150.0,
              estimated_delivery_days: 3,
              cod_charges: 20.0,
              cod_available: true,
              is_recommended: false,
            },
          ],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.calculateRates(
        "400001",
        "110001",
        1.5,
        1999.99,
        1999.99,
      );

      expect(result).toEqual({
        pickupPincode: "400001",
        deliveryPincode: "110001",
        weight: 1.5,
        orderValue: 1999.99,
        codAmount: 1999.99,
        courierRates: [
          {
            courierId: 1,
            courierName: "BlueDart",
            rate: 150.0,
            estimatedDeliveryDays: 3,
            codCharges: 20.0,
            totalRate: 170.0,
            codAvailable: true,
            isRecommended: false,
          },
        ],
        totalCouriers: 1,
        message: "Rates calculated successfully",
      });
    });

    it("should throw error when not initialized", async () => {
      const newService = new NimbusPostService(configService);

      await expect(
        newService.calculateRates("400001", "110001", 1.5, 1999.99),
      ).rejects.toThrow("Nimbus Post is not initialized");
    });
  });

  describe("createShipment", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockConfigService.authenticate.mockResolvedValue({
        access_token: "test-token",
        expires_in: 3600,
      });
      service.initialize("test-api-key", "test-api-secret");
    });

    it("should create shipment and generate label successfully", async () => {
      const mockOrderId = "order-123";
      const mockOrder = {
        id: mockOrderId,
        orderNumber: "ORD-2025-001234",
        total: 1999.99,
        shippingAddressId: "address-123",
        shippingProvider: null,
      };

      const mockAddress = {
        id: "address-123",
        street: "123 Main St",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        country: "India",
      };

      const mockOrderItems = [
        { quantity: 2, price: 500, productVariantId: "variant-1" },
        { quantity: 1, price: 999.99, productVariantId: "variant-2" },
      ];

      const mockOrderChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockOrder]),
      };

      const mockAddressChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockAddress]),
      };

      const mockOrderItemsForPrepareChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockOrderItems),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockOrderChain)
        .mockReturnValueOnce(mockAddressChain)
        .mockReturnValueOnce(mockOrderItemsForPrepareChain);

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: "shipment-123" }]),
      });

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      };

      (db.update as jest.Mock).mockReturnValue(mockUpdateChain);

      mockConfigService.getBaseUrl.mockReturnValue(
        "https://api.nimbuspost.com/v1",
      );

      const mockCreateResponse = {
        shipment_id: 12345678,
        status: "success",
        status_code: 200,
        awb_code: "AWB123456789",
        courier_id: 1,
        courier_name: "BlueDart",
        label_url: "https://nimbuspost.s3.amazonaws.com/labels/label_12345678.pdf",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreateResponse,
      });

      const result = await service.createShipment(mockOrderId, 1, undefined, 1.5);

      expect(result).toEqual({
        shipmentId: 12345678,
        awbNumber: "AWB123456789",
        trackingNumber: "AWB123456789",
        labelUrl: "https://nimbuspost.s3.amazonaws.com/labels/label_12345678.pdf",
        status: "label_generated",
        message: "Shipment created and label generated successfully",
      });
    });

    it("should throw error when order not found", async () => {
      const mockEmptyChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };

      (db.select as jest.Mock).mockReturnValue(mockEmptyChain);

      await expect(
        service.createShipment("invalid-order", 1, undefined, 1.5),
      ).rejects.toThrow("Order with ID invalid-order not found");
    });

    it("should throw error when Nimbus Post is not initialized", async () => {
      const newService = new NimbusPostService(configService);

      await expect(
        newService.createShipment("order-123", 1, undefined, 1.5),
      ).rejects.toThrow("Nimbus Post is not initialized");
    });
  });

  describe("trackShipment", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockConfigService.authenticate.mockResolvedValue({
        access_token: "test-token",
        expires_in: 3600,
      });
      service.initialize("test-api-key", "test-api-secret");
    });

    it("should track shipment successfully", async () => {
      const mockAwbNumber = "AWB123456789";
      const mockTrackingResponse = {
        tracking_data: {
          tracking_status: "In Transit",
          tracking_status_date: "2025-11-26T10:30:00Z",
          tracking_status_location: "Mumbai",
          courier_tracking_id: "NP123456789",
          estimated_delivery_date: "2025-11-28",
          shipment_track: [
            {
              tracking_status: "Label Generated",
              tracking_status_date: "2025-11-26T09:00:00Z",
              tracking_status_location: "Mumbai",
              tracking_status_description: "Label generated",
            },
            {
              tracking_status: "In Transit",
              tracking_status_date: "2025-11-26T10:30:00Z",
              tracking_status_location: "Mumbai",
              tracking_status_description: "In transit to destination",
            },
          ],
        },
      };

      mockConfigService.getBaseUrl.mockReturnValue(
        "https://api.nimbuspost.com/v1",
      );

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrackingResponse,
      });

      const mockShipmentSelectChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          {
            id: "shipment-123",
            awbNumber: mockAwbNumber,
            status: "pending",
          },
        ]),
      };

      (db.select as jest.Mock).mockReturnValue(mockShipmentSelectChain);

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      };

      (db.update as jest.Mock).mockReturnValue(mockUpdateChain);

      const result = await service.trackShipment(mockAwbNumber);

      expect(result).toEqual({
        awbNumber: mockAwbNumber,
        trackingNumber: "NP123456789",
        status: "in_transit",
        statusDescription: "In Transit",
        estimatedDeliveryDate: "2025-11-28",
        events: [
          {
            date: "2025-11-26T09:00:00Z",
            status: "Label Generated",
            location: "Mumbai",
            description: "Label generated",
          },
          {
            date: "2025-11-26T10:30:00Z",
            status: "In Transit",
            location: "Mumbai",
            description: "In transit to destination",
          },
        ],
        message: "Tracking information retrieved successfully",
      });
    });

    it("should throw error when Nimbus Post is not initialized", async () => {
      const newService = new NimbusPostService(configService);

      await expect(
        newService.trackShipment("AWB123456789"),
      ).rejects.toThrow("Nimbus Post is not initialized");
    });
  });
});

