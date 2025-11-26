import { Test, TestingModule } from "@nestjs/testing";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RazorpayConfigDto } from "./dto/razorpay-config.dto";

describe("PaymentsController", () => {
  let controller: PaymentsController;
  let paymentsService: PaymentsService;

  const mockPaymentsService = {
    isInitialized: jest.fn(),
    initialize: jest.fn(),
  };

  const mockAdminUser = {
    userId: "user-123",
    email: "admin@example.com",
    role: "admin",
  };

  const mockCustomerUser = {
    userId: "user-456",
    email: "customer@example.com",
    role: "customer",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    paymentsService = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getRazorpayStatus", () => {
    it("should return initialization status when initialized", () => {
      mockPaymentsService.isInitialized.mockReturnValue(true);

      const result = controller.getRazorpayStatus();

      expect(result).toEqual({
        initialized: true,
        message: "Razorpay is initialized",
      });
      expect(paymentsService.isInitialized).toHaveBeenCalled();
    });

    it("should return not initialized status when not initialized", () => {
      mockPaymentsService.isInitialized.mockReturnValue(false);

      const result = controller.getRazorpayStatus();

      expect(result).toEqual({
        initialized: false,
        message: "Razorpay is not initialized",
      });
      expect(paymentsService.isInitialized).toHaveBeenCalled();
    });
  });

  describe("initializeRazorpay", () => {
    const validConfig: RazorpayConfigDto = {
      keyId: "rzp_test_1234567890",
      keySecret: "secret_1234567890",
    };

    it("should initialize Razorpay with valid config", () => {
      mockPaymentsService.initialize.mockReturnValue(undefined);

      const result = controller.initializeRazorpay(validConfig);

      expect(result).toEqual({
        initialized: true,
        message: "Razorpay initialized successfully",
      });
      expect(paymentsService.initialize).toHaveBeenCalledWith(
        validConfig.keyId,
        validConfig.keySecret,
      );
    });

    it("should call initialize with correct parameters", () => {
      mockPaymentsService.initialize.mockReturnValue(undefined);

      controller.initializeRazorpay(validConfig);

      expect(paymentsService.initialize).toHaveBeenCalledWith(
        "rzp_test_1234567890",
        "secret_1234567890",
      );
    });

    it("should handle initialization with different config values", () => {
      const differentConfig: RazorpayConfigDto = {
        keyId: "rzp_live_9876543210",
        keySecret: "live_secret_9876543210",
      };

      mockPaymentsService.initialize.mockReturnValue(undefined);

      const result = controller.initializeRazorpay(differentConfig);

      expect(result).toEqual({
        initialized: true,
        message: "Razorpay initialized successfully",
      });
      expect(paymentsService.initialize).toHaveBeenCalledWith(
        differentConfig.keyId,
        differentConfig.keySecret,
      );
    });
  });
});

