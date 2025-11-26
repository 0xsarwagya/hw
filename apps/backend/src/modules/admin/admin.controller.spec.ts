import { Test, TestingModule } from "@nestjs/testing";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { BulkProductOperationDto } from "./dto/bulk-operations.dto";

describe("AdminController", () => {
  let controller: AdminController;
  let adminService: AdminService;

  const mockAdminService = {
    getAllProducts: jest.fn(),
    getAllOrders: jest.fn(),
    getAllCustomers: jest.fn(),
    getStats: jest.fn(),
    bulkProductOperation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);

    jest.clearAllMocks();
  });

  describe("getProducts", () => {
    it("should return paginated products", async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
      };

      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockAdminService.getAllProducts.mockResolvedValue(mockResponse);

      const result = await controller.getProducts(mockQuery);

      expect(result).toEqual(mockResponse);
      expect(adminService.getAllProducts).toHaveBeenCalledWith(mockQuery);
    });
  });

  describe("getOrders", () => {
    it("should return paginated orders", async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
      };

      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockAdminService.getAllOrders.mockResolvedValue(mockResponse);

      const result = await controller.getOrders(mockQuery);

      expect(result).toEqual(mockResponse);
      expect(adminService.getAllOrders).toHaveBeenCalledWith(mockQuery);
    });

    it("should filter orders by status", async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
        status: "pending" as const,
      };

      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockAdminService.getAllOrders.mockResolvedValue(mockResponse);

      const result = await controller.getOrders(mockQuery);

      expect(result).toEqual(mockResponse);
      expect(adminService.getAllOrders).toHaveBeenCalledWith(mockQuery);
    });
  });

  describe("getCustomers", () => {
    it("should return paginated customers", async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
      };

      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockAdminService.getAllCustomers.mockResolvedValue(mockResponse);

      const result = await controller.getCustomers(mockQuery);

      expect(result).toEqual(mockResponse);
      expect(adminService.getAllCustomers).toHaveBeenCalledWith(mockQuery);
    });

    it("should search customers", async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
        search: "test@example.com",
      };

      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockAdminService.getAllCustomers.mockResolvedValue(mockResponse);

      const result = await controller.getCustomers(mockQuery);

      expect(result).toEqual(mockResponse);
      expect(adminService.getAllCustomers).toHaveBeenCalledWith(mockQuery);
    });
  });

  describe("getStats", () => {
    it("should return dashboard statistics", async () => {
      const mockStats = {
        totalProducts: 100,
        activeProducts: 80,
        totalOrders: 500,
        pendingOrders: 25,
        totalCustomers: 200,
        totalRevenue: 500000,
        monthlyRevenue: 50000,
        averageOrderValue: 2500,
      };

      mockAdminService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats();

      expect(result).toEqual(mockStats);
      expect(adminService.getStats).toHaveBeenCalled();
    });
  });

  describe("bulkProductOperation", () => {
    it("should perform bulk operation on products", async () => {
      const mockDto: BulkProductOperationDto = {
        productIds: ["product-1", "product-2"],
        operation: "activate" as const,
      };

      const mockResponse = {
        affected: 2,
        operation: "activate",
        message: "Successfully activated 2 product(s)",
      };

      mockAdminService.bulkProductOperation.mockResolvedValue(mockResponse);

      const result = await controller.bulkProductOperation(mockDto);

      expect(result).toEqual(mockResponse);
      expect(adminService.bulkProductOperation).toHaveBeenCalledWith(mockDto);
    });
  });
});

