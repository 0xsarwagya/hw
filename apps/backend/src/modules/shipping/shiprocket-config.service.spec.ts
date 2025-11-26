import { Test, TestingModule } from "@nestjs/testing";
import { ShiprocketConfigService } from "./shiprocket-config.service";

// Mock fetch globally
global.fetch = jest.fn();

describe("ShiprocketConfigService", () => {
  let service: ShiprocketConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShiprocketConfigService],
    }).compile();

    service = module.get<ShiprocketConfigService>(ShiprocketConfigService);
    jest.clearAllMocks();
  });

  describe("getBaseUrl", () => {
    it("should return the default base URL", () => {
      const baseUrl = service.getBaseUrl();
      expect(baseUrl).toBe("https://apiv2.shiprocket.in/v1/external");
    });
  });

  describe("authenticate", () => {
    const mockConfig = {
      email: "test@example.com",
      password: "test-password",
    };

    it("should authenticate successfully with valid credentials", async () => {
      const mockResponse = {
        token: "test-token-123",
        expires_in: 86400,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.authenticate(mockConfig);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://apiv2.shiprocket.in/v1/external/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: mockConfig.email,
            password: mockConfig.password,
          }),
        },
      );
    });

    it("should use custom baseUrl when provided", async () => {
      const customBaseUrl = "https://custom-api.example.com";
      const mockResponse = {
        token: "test-token-123",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await service.authenticate({
        ...mockConfig,
        baseUrl: customBaseUrl,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${customBaseUrl}/auth/login`,
        expect.any(Object),
      );
    });

    it("should throw error when authentication fails", async () => {
      const mockError = {
        message: "Invalid credentials",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Unauthorized",
        json: async () => mockError,
      });

      await expect(service.authenticate(mockConfig)).rejects.toThrow(
        "Shiprocket authentication failed: Invalid credentials",
      );
    });

    it("should handle network errors", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      await expect(service.authenticate(mockConfig)).rejects.toThrow(
        "Network error",
      );
    });

    it("should handle response without error message", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Bad Request",
        json: async () => ({}),
      });

      await expect(service.authenticate(mockConfig)).rejects.toThrow(
        "Shiprocket authentication failed: Bad Request",
      );
    });
  });
});

