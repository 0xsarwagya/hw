import { Test, TestingModule } from "@nestjs/testing";
import { ShiprocketService } from "./shiprocket.service";
import { ShiprocketConfigService } from "./shiprocket-config.service";

// Mock fetch globally
global.fetch = jest.fn();

describe("ShiprocketService", () => {
  let service: ShiprocketService;
  let configService: ShiprocketConfigService;

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
      ],
    }).compile();

    service = module.get<ShiprocketService>(ShiprocketService);
    configService =
      module.get<ShiprocketConfigService>(ShiprocketConfigService);

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

      const newService = new ShiprocketService(configService);
      newService.onModuleInit();

      expect(newService.isInitialized()).toBe(true);
    });

    it("should not initialize when email is missing", () => {
      delete process.env.SHIPROCKET_EMAIL;
      process.env.SHIPROCKET_PASSWORD = "env-password";

      const newService = new ShiprocketService(configService);
      newService.onModuleInit();

      expect(newService.isInitialized()).toBe(false);
    });

    it("should not initialize when password is missing", () => {
      process.env.SHIPROCKET_EMAIL = "env@example.com";
      delete process.env.SHIPROCKET_PASSWORD;

      const newService = new ShiprocketService(configService);
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
});

