import { Test, TestingModule } from "@nestjs/testing";
import { ShiprocketService } from "./shiprocket.service";
import { ShiprocketConfigService } from "./shiprocket-config.service";
import { db, eq, orders, addresses, orderItems, shipments } from "@vcecom/db";
import { getCommonTestProviders } from "../../common/testing/test-helpers";
import { AppConfigService } from "../../common/config/app.config.service";

// Mock fetch globally
global.fetch = jest.fn();

// Mock database module
jest.mock("@vcecom/db", () => ({
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

describe("ShiprocketService", () => {
  let service: ShiprocketService;
  let configService: ShiprocketConfigService;
  let appConfigService: AppConfigService;

  const mockConfigService = {
    getBaseUrl: jest.fn(),
    authenticate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiprocketService,
        {
          provide: ShiprocketConfigService,
          useValue: mockConfigService,
        },
        ...getCommonTestProviders(),
      ],
    }).compile();

    service = module.get<ShiprocketService>(ShiprocketService);
    configService =
      module.get<ShiprocketConfigService>(ShiprocketConfigService);
    appConfigService = module.get<AppConfigService>(AppConfigService);

    jest.clearAllMocks();
    mockConfigService.getBaseUrl.mockReturnValue(
      "https://apiv2.shiprocket.in/v1/external",
    );
  });

  afterEach(() => {
    delete process.env.SHIPROCKET_EMAIL;
    delete process.env.SHIPROCKET_PASSWORD;
  });

  describe("onModuleInit", () => {
    it("should store credentials from environment variables", () => {
      process.env.SHIPROCKET_EMAIL = "env@example.com";
      process.env.SHIPROCKET_PASSWORD = "env-password";

      const newService = new ShiprocketService(configService, appConfigService);
      newService.onModuleInit();

      expect(newService.isInitialized()).toBe(true);
    });

    it("should not initialize when email is missing", () => {
      delete process.env.SHIPROCKET_EMAIL;
      process.env.SHIPROCKET_PASSWORD = "env-password";

      const newService = new ShiprocketService(configService, appConfigService);
      newService.onModuleInit();

      expect(newService.isInitialized()).toBe(false);
    });

    it("should not initialize when password is missing", () => {
      process.env.SHIPROCKET_EMAIL = "env@example.com";
      delete process.env.SHIPROCKET_PASSWORD;

      const newService = new ShiprocketService(configService, appConfigService);
      newService.onModuleInit();

      expect(newService.isInitialized()).toBe(false);
    });
  });

  describe("initialize", () => {
    it("should initialize with credentials and authenticate", async () => {
      const mockAuthResponse = {
        token: "test-token",
        expires_in: 3600,
      };

      mockConfigService.authenticate.mockResolvedValue(mockAuthResponse);

      await service.initialize("test@example.com", "test-password");

      expect(service.isInitialized()).toBe(true);
      expect(mockConfigService.authenticate).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "test-password",
        baseUrl: "https://apiv2.shiprocket.in/v1/external",
      });
    });

    it("should throw error when authenticate fails", async () => {
      mockConfigService.authenticate.mockRejectedValueOnce(
        new Error("Authentication failed"),
      );

      await expect(
        service.initialize("test@example.com", "test-password"),
      ).rejects.toThrow("Authentication failed");
    });
  });

  describe("authenticate", () => {
    beforeEach(async () => {
      await service.initialize("test@example.com", "test-password");
    });

    it("should authenticate and store token", async () => {
      const mockAuthResponse = {
        token: "new-token",
        expires_in: 7200,
      };

      mockConfigService.authenticate.mockResolvedValueOnce(mockAuthResponse);

      const token = await service.authenticate();

      expect(token).toBe("new-token");
      expect(mockConfigService.authenticate).toHaveBeenCalled();
    });

    it("should use default expiration when not provided", async () => {
      const mockAuthResponse = {
        token: "new-token",
      };

      mockConfigService.authenticate.mockResolvedValueOnce(mockAuthResponse);

      await service.authenticate();

      const token = await service.getAuthToken();
      expect(token).toBe("new-token");
    });

    it("should throw error when credentials are not set", async () => {
      const newService = new ShiprocketService(configService);

      await expect(newService.authenticate()).rejects.toThrow(
        "Shiprocket credentials not configured",
      );
    });
  });

  describe("getAuthToken", () => {
    it("should authenticate if token is not available", async () => {
      const mockAuthResponse = {
        token: "initial-token",
        expires_in: 3600,
      };

      mockConfigService.authenticate.mockResolvedValue(mockAuthResponse);
      await service.initialize("test@example.com", "test-password");
      jest.clearAllMocks();

      mockConfigService.authenticate.mockResolvedValue({
        token: "new-token",
        expires_in: 3600,
      });

      // Create a new service instance without token
      const newService = new ShiprocketService(configService);
      await newService.initialize("test@example.com", "test-password");

      const token = await newService.getAuthToken();

      expect(token).toBeDefined();
      expect(mockConfigService.authenticate).toHaveBeenCalled();
    });

    it("should return existing token if not expired", async () => {
      const mockAuthResponse = {
        token: "existing-token",
        expires_in: 3600,
      };

      mockConfigService.authenticate.mockResolvedValue(mockAuthResponse);
      await service.initialize("test@example.com", "test-password");
      jest.clearAllMocks();

      mockConfigService.authenticate.mockResolvedValue(mockAuthResponse);

      const token1 = await service.getAuthToken();
      const token2 = await service.getAuthToken();

      expect(token1).toBe("existing-token");
      expect(token2).toBe("existing-token");
      // Should not authenticate again since token is still valid
      expect(mockConfigService.authenticate).not.toHaveBeenCalled();
    });
  });

  describe("isInitialized", () => {
    it("should return false when not initialized", () => {
      expect(service.isInitialized()).toBe(false);
    });

    it("should return true when initialized", async () => {
      await service.initialize("test@example.com", "test-password");
      expect(service.isInitialized()).toBe(true);
    });
  });

  describe("testConnection", () => {
    it("should return success when connection is successful", async () => {
      const mockAuthResponse = {
        token: "test-token",
        expires_in: 3600,
      };

      mockConfigService.authenticate.mockResolvedValue(mockAuthResponse);
      await service.initialize("test@example.com", "test-password");

      const result = await service.testConnection();

      expect(result.success).toBe(true);
      expect(result.message).toBe("Shiprocket API connection successful");
      expect(result.authenticated).toBe(true);
    });

    it("should return failure when not initialized", async () => {
      const newService = new ShiprocketService(configService);
      const result = await newService.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Shiprocket is not initialized");
      expect(result.authenticated).toBe(false);
    });

    it("should return failure when authentication fails", async () => {
      // Create a new service and initialize it
      const newService = new ShiprocketService(configService);
      const mockAuthResponse = {
        token: "init-token",
        expires_in: 1, // Very short expiration
      };
      mockConfigService.authenticate.mockResolvedValue(mockAuthResponse);
      await newService.initialize("test@example.com", "test-password");

      // Wait for token to expire
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Now mock authentication to fail
      mockConfigService.authenticate.mockRejectedValueOnce(
        new Error("Authentication failed"),
      );

      const result = await newService.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Authentication failed");
      expect(result.authenticated).toBe(false);
    });
  });

  describe("makeRequest", () => {
    beforeEach(async () => {
      const mockAuthResponse = {
        token: "test-token",
        expires_in: 3600,
      };

      mockConfigService.authenticate.mockResolvedValue(mockAuthResponse);
      await service.initialize("test@example.com", "test-password");
      jest.clearAllMocks();
    });

    it("should make authenticated request successfully", async () => {
      const mockResponse = { data: "test" };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.makeRequest("/test-endpoint");

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://apiv2.shiprocket.in/v1/external/test-endpoint",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
        },
      );
    });

    it("should handle endpoint without leading slash", async () => {
      const mockResponse = { data: "test" };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await service.makeRequest("test-endpoint");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://apiv2.shiprocket.in/v1/external/test-endpoint",
        expect.any(Object),
      );
    });

    it("should include custom options in request", async () => {
      const mockResponse = { data: "test" };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await service.makeRequest("/test-endpoint", {
        method: "POST",
        body: JSON.stringify({ test: "data" }),
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://apiv2.shiprocket.in/v1/external/test-endpoint",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ test: "data" }),
        }),
      );
    });

    it("should throw error when request fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
        json: async () => ({ message: "Resource not found" }),
      });

      await expect(service.makeRequest("/test-endpoint")).rejects.toThrow(
        "Shiprocket API request failed: Resource not found",
      );
    });

    it("should handle error response without message", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Internal Server Error",
        json: async () => ({}),
      });

      await expect(service.makeRequest("/test-endpoint")).rejects.toThrow(
        "Shiprocket API request failed: Internal Server Error",
      );
    });
  });

  describe("calculateRates", () => {
    beforeEach(() => {
      service.initialize("test@example.com", "test-password");
    });

    it("should calculate rates successfully", async () => {
      const mockRateResponse = {
        data: {
          available_courier_companies: [
            {
              id: 1,
              courier_name: "BlueDart",
              rate: 150.0,
              estimated_delivery_days: 3,
              cod_charges: 20.0,
              cod_available: true,
              is_recommended: false,
            },
            {
              id: 2,
              courier_name: "DTDC",
              rate: 120.0,
              estimated_delivery_days: 4,
              cod_charges: 15.0,
              cod_available: true,
              is_recommended: true,
            },
          ],
        },
      };

      mockConfigService.authenticate.mockResolvedValue({
        token: "test-token",
        expires_in: 3600,
      });

      mockConfigService.getBaseUrl.mockReturnValue(
        "https://apiv2.shiprocket.in/v1/external",
      );

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRateResponse,
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
          {
            courierId: 2,
            courierName: "DTDC",
            rate: 120.0,
            estimatedDeliveryDays: 4,
            codCharges: 15.0,
            totalRate: 135.0,
            codAvailable: true,
            isRecommended: true,
          },
        ],
        totalCouriers: 2,
        message: "Rates calculated successfully",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://apiv2.shiprocket.in/v1/external/courier/serviceability/",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          }),
          body: JSON.stringify({
            pickup_postcode: "400001",
            delivery_postcode: "110001",
            weight: 1.5,
            order_amount: 1999.99,
            cod_amount: 1999.99,
          }),
        }),
      );
    });

    it("should calculate rates without COD amount", async () => {
      const mockRateResponse = {
        data: {
          available_courier_companies: [
            {
              id: 1,
              courier_name: "BlueDart",
              rate: 150.0,
              estimated_delivery_days: 3,
              cod_charges: 0,
              cod_available: false,
              is_recommended: false,
            },
          ],
        },
      };

      mockConfigService.authenticate.mockResolvedValue({
        token: "test-token",
        expires_in: 3600,
      });

      mockConfigService.getBaseUrl.mockReturnValue(
        "https://apiv2.shiprocket.in/v1/external",
      );

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRateResponse,
      });

      const result = await service.calculateRates(
        "400001",
        "110001",
        1.5,
        1999.99,
      );

      expect(result.codAmount).toBeNull();
      expect(result.courierRates[0].codCharges).toBe(0);
      expect(result.courierRates[0].codAvailable).toBe(false);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            pickup_postcode: "400001",
            delivery_postcode: "110001",
            weight: 1.5,
            order_amount: 1999.99,
          }),
        }),
      );
    });

    it("should handle empty courier list", async () => {
      const mockRateResponse = {
        data: {
          available_courier_companies: [],
        },
      };

      mockConfigService.authenticate.mockResolvedValue({
        token: "test-token",
        expires_in: 3600,
      });

      mockConfigService.getBaseUrl.mockReturnValue(
        "https://apiv2.shiprocket.in/v1/external",
      );

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRateResponse,
      });

      const result = await service.calculateRates(
        "400001",
        "999999", // Invalid PIN code
        1.5,
        1999.99,
      );

      expect(result.courierRates).toEqual([]);
      expect(result.totalCouriers).toBe(0);
      expect(result.message).toBe("No couriers available for this route");
    });

    it("should handle couriers without COD charges", async () => {
      const mockRateResponse = {
        data: {
          available_courier_companies: [
            {
              id: 1,
              courier_name: "BlueDart",
              rate: 150.0,
              estimated_delivery_days: null,
              cod_available: false,
            },
          ],
        },
      };

      mockConfigService.authenticate.mockResolvedValue({
        token: "test-token",
        expires_in: 3600,
      });

      mockConfigService.getBaseUrl.mockReturnValue(
        "https://apiv2.shiprocket.in/v1/external",
      );

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRateResponse,
      });

      const result = await service.calculateRates(
        "400001",
        "110001",
        1.5,
        1999.99,
      );

      expect(result.courierRates[0].codCharges).toBe(0);
      expect(result.courierRates[0].totalRate).toBe(150.0);
      expect(result.courierRates[0].estimatedDeliveryDays).toBeNull();
      expect(result.courierRates[0].isRecommended).toBe(false);
    });

    it("should throw error when Shiprocket is not initialized", async () => {
      const newService = new ShiprocketService(configService);

      await expect(
        newService.calculateRates("400001", "110001", 1.5, 1999.99),
      ).rejects.toThrow("Shiprocket is not initialized");
    });

    it("should handle API errors", async () => {
      mockConfigService.authenticate.mockResolvedValue({
        token: "test-token",
        expires_in: 3600,
      });

      mockConfigService.getBaseUrl.mockReturnValue(
        "https://apiv2.shiprocket.in/v1/external",
      );

      service.initialize("test@example.com", "test-password");

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Bad Request",
        json: async () => ({
          message: "Invalid PIN code",
        }),
      });

      await expect(
        service.calculateRates("400001", "110001", 1.5, 1999.99),
      ).rejects.toThrow("Shiprocket API request failed: Invalid PIN code");
    });
  });

  describe("createShipment", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      // Reset config service mocks
      mockConfigService.authenticate.mockReset();
      mockConfigService.getBaseUrl.mockReset();
      mockConfigService.getBaseUrl.mockReturnValue(
        "https://apiv2.shiprocket.in/v1/external",
      );
      // Setup authenticate mock before initialize
      mockConfigService.authenticate.mockResolvedValue({
        token: "test-token",
        expires_in: 3600,
      });
      service.initialize("test@example.com", "test-password");
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

      // Mock database queries - need to mock all 3 select calls
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

      // Mock for prepareOrderItems (called after order and address are fetched)
      const mockOrderItemsForPrepareChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockOrderItems),
      };

      // Setup mocks in order: order, address, then orderItems (for prepareOrderItems)
      (db.select as jest.Mock)
        .mockReturnValueOnce(mockOrderChain) // 1st call: get order
        .mockReturnValueOnce(mockAddressChain) // 2nd call: get address
        .mockReturnValueOnce(mockOrderItemsForPrepareChain); // 3rd call: get order items in prepareOrderItems

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: "shipment-123" }]),
      });

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      };

      (db.update as jest.Mock).mockReturnValue(mockUpdateChain);

      mockConfigService.authenticate.mockResolvedValue({
        token: "test-token",
        expires_in: 3600,
      });

      mockConfigService.getBaseUrl.mockReturnValue(
        "https://apiv2.shiprocket.in/v1/external",
      );

      // Mock Shiprocket API responses
      const mockCreateResponse = {
        shipment_id: 12345678,
        status: "success",
        status_code: 200,
        onboarding_completed_now: 1,
        awb_code: "",
        courier_company_id: 1,
        courier_name: "BlueDart",
      };

      const mockAwbResponse = {
        response: {
          awb_assign_status: 1,
          awb_code: ["AWB123456789"],
        },
      };

      const mockLabelResponse = {
        label_created: 1,
        response: {
          label_url: "https://shiprocket.s3.amazonaws.com/labels/label_12345678.pdf",
        },
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCreateResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAwbResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockLabelResponse,
        });

      // Pass weight to avoid weight calculation db.select call
      const result = await service.createShipment(mockOrderId, 1, undefined, 1.5);

      expect(result).toEqual({
        shipmentId: 12345678,
        awbNumber: "AWB123456789",
        trackingNumber: "AWB123456789",
        labelUrl: "https://shiprocket.s3.amazonaws.com/labels/label_12345678.pdf",
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

    it("should throw error when Shiprocket is not initialized", async () => {
      const newService = new ShiprocketService(configService);

      await expect(
        newService.createShipment("order-123", 1, undefined, 1.5),
      ).rejects.toThrow("Shiprocket is not initialized");
    });
  });

  describe("trackShipment", () => {
    beforeEach(() => {
      service.initialize("test@example.com", "test-password");
    });

    it("should track shipment successfully", async () => {
      const mockAwbNumber = "AWB123456789";
      const mockTrackingResponse = {
        tracking_data: {
          tracking_status: "In Transit",
          tracking_status_date: "2025-11-26T10:30:00Z",
          tracking_status_location: "Mumbai",
          courier_tracking_id: "SR123456789",
          estimated_delivery_date: "2025-11-28",
          shipment_track: [
            {
              tracking_status: "Label Generated",
              tracking_status_date: "2025-11-26T09:00:00Z",
              tracking_status_location: "Mumbai",
              tracking_status_description: "Label generated",
            },
            {
              tracking_status: "Picked Up",
              tracking_status_date: "2025-11-26T10:00:00Z",
              tracking_status_location: "Mumbai",
              tracking_status_description: "Shipment picked up",
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

      mockConfigService.authenticate.mockResolvedValue({
        token: "test-token",
        expires_in: 3600,
      });

      mockConfigService.getBaseUrl.mockReturnValue(
        "https://apiv2.shiprocket.in/v1/external",
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
        trackingNumber: "SR123456789",
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
            date: "2025-11-26T10:00:00Z",
            status: "Picked Up",
            location: "Mumbai",
            description: "Shipment picked up",
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

    it("should handle tracking without existing shipment in database", async () => {
      const mockAwbNumber = "AWB123456789";
      const mockTrackingResponse = {
        tracking_data: {
          tracking_status: "Delivered",
          tracking_status_date: "2025-11-27T12:00:00Z",
          tracking_status_location: "Delhi",
          courier_tracking_id: "SR123456789",
          estimated_delivery_date: null,
          shipment_track: [],
        },
      };

      mockConfigService.authenticate.mockResolvedValue({
        token: "test-token",
        expires_in: 3600,
      });

      mockConfigService.getBaseUrl.mockReturnValue(
        "https://apiv2.shiprocket.in/v1/external",
      );

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrackingResponse,
      });

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      const result = await service.trackShipment(mockAwbNumber);

      expect(result.status).toBe("delivered");
      expect(result.events).toEqual([]);
    });

    it("should throw error when Shiprocket is not initialized", async () => {
      const newService = new ShiprocketService(configService);

      await expect(
        newService.trackShipment("AWB123456789"),
      ).rejects.toThrow("Shiprocket is not initialized");
    });
  });
});

