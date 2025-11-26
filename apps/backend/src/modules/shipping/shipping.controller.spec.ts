import { Test, TestingModule } from "@nestjs/testing";
import { ShippingController } from "./shipping.controller";
import { ShiprocketService } from "./shiprocket.service";
import { ShiprocketConfigDto } from "./dto/shiprocket-config.dto";

describe("ShippingController", () => {
  let controller: ShippingController;
  let shiprocketService: ShiprocketService;

  const mockShiprocketService = {
    isInitialized: jest.fn(),
    initialize: jest.fn(),
    testConnection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShippingController],
      providers: [
        {
          provide: ShiprocketService,
          useValue: mockShiprocketService,
        },
      ],
    }).compile();

    controller = module.get<ShippingController>(ShippingController);
    shiprocketService =
      module.get<ShiprocketService>(ShiprocketService);

    jest.clearAllMocks();
  });

  describe("getShiprocketStatus", () => {
    it("should return initialized status when initialized", () => {
      mockShiprocketService.isInitialized.mockReturnValue(true);

      const result = controller.getShiprocketStatus();

      expect(result).toEqual({
        initialized: true,
        message: "Shiprocket is initialized",
      });
      expect(shiprocketService.isInitialized).toHaveBeenCalled();
    });

    it("should return not initialized status when not initialized", () => {
      mockShiprocketService.isInitialized.mockReturnValue(false);

      const result = controller.getShiprocketStatus();

      expect(result).toEqual({
        initialized: false,
        message: "Shiprocket is not initialized",
      });
      expect(shiprocketService.isInitialized).toHaveBeenCalled();
    });
  });

  describe("initializeShiprocket", () => {
    const validConfig: ShiprocketConfigDto = {
      email: "test@example.com",
      password: "test-password",
    };

    it("should initialize Shiprocket with valid config", async () => {
      mockShiprocketService.initialize.mockResolvedValue(undefined);

      const result = await controller.initializeShiprocket(validConfig);

      expect(result).toEqual({
        initialized: true,
        message: "Shiprocket initialized successfully",
      });
      expect(shiprocketService.initialize).toHaveBeenCalledWith(
        validConfig.email,
        validConfig.password,
      );
    });

    it("should handle initialization errors", async () => {
      mockShiprocketService.initialize.mockRejectedValue(
        new Error("Initialization failed"),
      );

      await expect(
        controller.initializeShiprocket(validConfig),
      ).rejects.toThrow("Initialization failed");
    });
  });

  describe("testConnection", () => {
    it("should return successful connection test result", async () => {
      mockShiprocketService.testConnection.mockResolvedValue({
        success: true,
        message: "Shiprocket API connection successful",
        authenticated: true,
      });

      const result = await controller.testConnection();

      expect(result).toEqual({
        success: true,
        message: "Shiprocket API connection successful",
        authenticated: true,
      });
      expect(shiprocketService.testConnection).toHaveBeenCalled();
    });

    it("should return failed connection test result", async () => {
      mockShiprocketService.testConnection.mockResolvedValue({
        success: false,
        message: "Shiprocket is not initialized",
        authenticated: false,
      });

      const result = await controller.testConnection();

      expect(result).toEqual({
        success: false,
        message: "Shiprocket is not initialized",
        authenticated: false,
      });
      expect(shiprocketService.testConnection).toHaveBeenCalled();
    });
  });
});

