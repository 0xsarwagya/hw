import { Test, TestingModule } from "@nestjs/testing";
import Razorpay from "razorpay";
import { RazorpayConfigService } from "./razorpay-config.service";

// Mock Razorpay
jest.mock("razorpay", () => {
  return jest.fn().mockImplementation((config) => {
    return {
      key_id: config.key_id,
      key_secret: config.key_secret,
    };
  });
});

describe("RazorpayConfigService", () => {
  let service: RazorpayConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RazorpayConfigService],
    }).compile();

    service = module.get<RazorpayConfigService>(RazorpayConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.reset();
  });

  describe("initialize", () => {
    it("should initialize Razorpay instance with valid config", () => {
      const config = {
        keyId: "rzp_test_1234567890",
        keySecret: "secret_1234567890",
      };

      const instance = service.initialize(config);

      expect(instance).toBeDefined();
      expect(Razorpay).toHaveBeenCalledWith({
        key_id: config.keyId,
        key_secret: config.keySecret,
      });
    });

    it("should throw error if keyId is missing", () => {
      const config = {
        keyId: "",
        keySecret: "secret_1234567890",
      };

      expect(() => service.initialize(config)).toThrow(
        "Razorpay keyId and keySecret are required for initialization",
      );
    });

    it("should throw error if keySecret is missing", () => {
      const config = {
        keyId: "rzp_test_1234567890",
        keySecret: "",
      };

      expect(() => service.initialize(config)).toThrow(
        "Razorpay keyId and keySecret are required for initialization",
      );
    });

    it("should throw error if both keyId and keySecret are missing", () => {
      const config = {
        keyId: "",
        keySecret: "",
      };

      expect(() => service.initialize(config)).toThrow(
        "Razorpay keyId and keySecret are required for initialization",
      );
    });
  });

  describe("getInstance", () => {
    it("should return null if not initialized", () => {
      const instance = service.getInstance();
      expect(instance).toBeNull();
    });

    it("should return Razorpay instance after initialization", () => {
      const config = {
        keyId: "rzp_test_1234567890",
        keySecret: "secret_1234567890",
      };

      service.initialize(config);
      const instance = service.getInstance();

      expect(instance).toBeDefined();
      expect(instance).not.toBeNull();
    });
  });

  describe("isInitialized", () => {
    it("should return false if not initialized", () => {
      expect(service.isInitialized()).toBe(false);
    });

    it("should return true after initialization", () => {
      const config = {
        keyId: "rzp_test_1234567890",
        keySecret: "secret_1234567890",
      };

      service.initialize(config);
      expect(service.isInitialized()).toBe(true);
    });
  });

  describe("reset", () => {
    it("should reset the Razorpay instance", () => {
      const config = {
        keyId: "rzp_test_1234567890",
        keySecret: "secret_1234567890",
      };

      service.initialize(config);
      expect(service.isInitialized()).toBe(true);

      service.reset();
      expect(service.isInitialized()).toBe(false);
      expect(service.getInstance()).toBeNull();
    });
  });
});

