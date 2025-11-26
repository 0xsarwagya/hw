import { Test, TestingModule } from "@nestjs/testing";
import Razorpay from "razorpay";
import { PaymentsService } from "./payments.service";
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

describe("PaymentsService", () => {
  let service: PaymentsService;
  let razorpayConfigService: RazorpayConfigService;

  const mockRazorpayInstance = {
    key_id: "rzp_test_1234567890",
    key_secret: "secret_1234567890",
  };

  beforeEach(async () => {
    // Clear environment variables
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentsService, RazorpayConfigService],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    razorpayConfigService =
      module.get<RazorpayConfigService>(RazorpayConfigService);

    // Mock initialize method
    jest
      .spyOn(razorpayConfigService, "initialize")
      .mockReturnValue(mockRazorpayInstance as unknown as Razorpay);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
  });

  describe("onModuleInit", () => {
    it("should initialize Razorpay when environment variables are set", () => {
      process.env.RAZORPAY_KEY_ID = "rzp_test_1234567890";
      process.env.RAZORPAY_KEY_SECRET = "secret_1234567890";

      service.onModuleInit();

      expect(razorpayConfigService.initialize).toHaveBeenCalledWith({
        keyId: "rzp_test_1234567890",
        keySecret: "secret_1234567890",
      });
    });

    it("should not initialize Razorpay when keyId is missing", () => {
      process.env.RAZORPAY_KEY_SECRET = "secret_1234567890";

      service.onModuleInit();

      expect(razorpayConfigService.initialize).not.toHaveBeenCalled();
    });

    it("should not initialize Razorpay when keySecret is missing", () => {
      process.env.RAZORPAY_KEY_ID = "rzp_test_1234567890";

      service.onModuleInit();

      expect(razorpayConfigService.initialize).not.toHaveBeenCalled();
    });

    it("should not initialize Razorpay when both environment variables are missing", () => {
      service.onModuleInit();

      expect(razorpayConfigService.initialize).not.toHaveBeenCalled();
    });
  });

  describe("getRazorpayInstance", () => {
    it("should return Razorpay instance when initialized", () => {
      service.initialize("rzp_test_1234567890", "secret_1234567890");

      const instance = service.getRazorpayInstance();

      expect(instance).toBeDefined();
      expect(instance).toBe(mockRazorpayInstance);
    });

    it("should throw error when Razorpay is not initialized", () => {
      expect(() => service.getRazorpayInstance()).toThrow(
        "Razorpay is not initialized. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.",
      );
    });
  });

  describe("isInitialized", () => {
    it("should return false when not initialized", () => {
      expect(service.isInitialized()).toBe(false);
    });

    it("should return true after initialization", () => {
      service.initialize("rzp_test_1234567890", "secret_1234567890");
      expect(service.isInitialized()).toBe(true);
    });
  });

  describe("initialize", () => {
    it("should initialize Razorpay with provided credentials", () => {
      service.initialize("rzp_test_1234567890", "secret_1234567890");

      expect(razorpayConfigService.initialize).toHaveBeenCalledWith({
        keyId: "rzp_test_1234567890",
        keySecret: "secret_1234567890",
      });
      expect(service.isInitialized()).toBe(true);
    });

    it("should allow re-initialization with different credentials", () => {
      service.initialize("rzp_test_1234567890", "secret_1234567890");
      service.initialize("rzp_test_0987654321", "secret_0987654321");

      expect(razorpayConfigService.initialize).toHaveBeenCalledTimes(2);
      expect(razorpayConfigService.initialize).toHaveBeenLastCalledWith({
        keyId: "rzp_test_0987654321",
        keySecret: "secret_0987654321",
      });
    });
  });
});

