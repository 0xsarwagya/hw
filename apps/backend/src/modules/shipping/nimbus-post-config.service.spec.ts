import { Test, TestingModule } from "@nestjs/testing";
import { NimbusPostConfigService } from "./nimbus-post-config.service";

// Mock fetch globally
global.fetch = jest.fn();

describe("NimbusPostConfigService", () => {
  let service: NimbusPostConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NimbusPostConfigService],
    }).compile();

    service = module.get<NimbusPostConfigService>(NimbusPostConfigService);
    jest.clearAllMocks();
  });

  describe("getBaseUrl", () => {
    it("should return default base URL", () => {
      const baseUrl = service.getBaseUrl();
      expect(baseUrl).toBe("https://api.nimbuspost.com/v1");
    });
  });

  describe("authenticate", () => {
    it("should authenticate successfully with valid credentials", async () => {
      const mockResponse = {
        access_token: "test-token-123",
        expires_in: 3600,
        token_type: "Bearer",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.authenticate({
        apiKey: "test-api-key",
        apiSecret: "test-api-secret",
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.nimbuspost.com/v1/auth/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: "test-api-key",
            api_secret: "test-api-secret",
          }),
        },
      );
    });

    it("should use custom base URL when provided", async () => {
      const mockResponse = {
        access_token: "test-token-123",
        expires_in: 3600,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await service.authenticate({
        apiKey: "test-api-key",
        apiSecret: "test-api-secret",
        baseUrl: "https://custom.api.com/v1",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://custom.api.com/v1/auth/token",
        expect.any(Object),
      );
    });

    it("should throw error when authentication fails", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Unauthorized",
        json: async () => ({
          message: "Invalid credentials",
        }),
      });

      await expect(
        service.authenticate({
          apiKey: "invalid-key",
          apiSecret: "invalid-secret",
        }),
      ).rejects.toThrow("Nimbus Post authentication failed: Invalid credentials");
    });

    it("should handle network errors", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      await expect(
        service.authenticate({
          apiKey: "test-key",
          apiSecret: "test-secret",
        }),
      ).rejects.toThrow("Network error");
    });
  });
});

