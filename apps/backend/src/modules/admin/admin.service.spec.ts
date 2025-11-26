import { Test, TestingModule } from "@nestjs/testing";
import {
  customers,
  db,
  eq,
  orderItems,
  orders,
  products,
} from "@vcecom/db";
import { ProductsService } from "../products/products.service";
import { AdminService } from "./admin.service";
import { BulkProductOperation } from "./dto/bulk-operations.dto";

// Mock database module
jest.mock("@vcecom/db", () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  eq: jest.fn(),
  and: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
  ilike: jest.fn(),
  inArray: jest.fn(),
  or: jest.fn(),
  desc: jest.fn(),
  customers: {},
  orders: {},
  orderItems: {},
  products: {},
}));

// Mock ProductsService
jest.mock("../products/products.service");

describe("AdminService", () => {
  let service: AdminService;
  let productsService: ProductsService;

  const mockProductsService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    productsService =
      module.get<ProductsService>(ProductsService);

    jest.clearAllMocks();
  });

  describe("getAllProducts", () => {
    it("should return products from ProductsService", async () => {
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

      mockProductsService.findAll.mockResolvedValue(mockResponse);

      const result = await service.getAllProducts(mockQuery);

      expect(result).toEqual(mockResponse);
      expect(productsService.findAll).toHaveBeenCalledWith(mockQuery);
    });
  });

  describe("getAllOrders", () => {
    it("should return paginated orders without filters", async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
      };

      const mockOrders = [
        {
          id: "order-1",
          customerId: "customer-1",
          orderNumber: "ORD-2025-001234",
          status: "pending",
          subtotal: 1000,
          gstAmount: 180,
          shippingCost: 50,
          total: 1230,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockOrderItems = [
        {
          id: "item-1",
          orderId: "order-1",
          productVariantId: "variant-1",
          quantity: 2,
          price: 500,
        },
      ];

      // Mock count query (no where condition)
      const mockCountChain = {
        from: jest.fn().mockResolvedValue(mockOrders),
      };

      // Mock orders query with pagination (no where condition)
      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue(mockOrders),
            }),
          }),
        }),
      };

      const mockOrderItemsChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockOrderItems),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCountChain) // Count query
        .mockReturnValueOnce(mockOrdersChain) // Orders query
        .mockReturnValueOnce(mockOrderItemsChain); // Order items query

      const result = await service.getAllOrders(mockQuery);

      expect(result).toEqual({
        data: [
          {
            ...mockOrders[0],
            items: mockOrderItems,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it("should filter orders by status", async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
        status: "pending" as const,
      };

      const mockOrders = [];
      // Mock count query (with where condition)
      // db.select().from(orders).where(whereCondition) -> await -> array
      const mockCountFromChain = {
        where: jest.fn().mockResolvedValue(mockOrders),
      };
      const mockCountChain = {
        from: jest.fn().mockReturnValue(mockCountFromChain),
      };

      // Mock orders query with pagination (with where condition)
      // The ternary: db.select().from(orders).where(whereCondition)
      // So: select() -> from() -> where() -> limit() -> offset() -> orderBy() -> await
      const mockWhereResult = {
        limit: jest.fn().mockReturnValue({
          offset: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockOrders),
          }),
        }),
      };
      const mockOrdersFromChain = {
        where: jest.fn().mockReturnValue(mockWhereResult),
      };
      const mockOrdersChain = {
        from: jest.fn().mockReturnValue(mockOrdersFromChain),
      };

      const mockOrderItemsChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCountChain) // Count query
        .mockReturnValueOnce(mockOrdersChain) // Orders query
        .mockReturnValueOnce(mockOrderItemsChain); // Order items query

      await service.getAllOrders(mockQuery);

      expect(db.select).toHaveBeenCalled();
    });

    it("should filter orders by date range", async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
        startDate: "2025-01-01T00:00:00Z",
        endDate: "2025-12-31T23:59:59Z",
      };

      const mockOrders = [];
      // Mock count query (with where condition)
      const mockCountFromChain = {
        where: jest.fn().mockResolvedValue(mockOrders),
      };
      const mockCountChainWithWhere = {
        from: jest.fn().mockReturnValue(mockCountFromChain),
      };

      // Mock orders query with where condition
      const mockWhereResult = {
        limit: jest.fn().mockReturnValue({
          offset: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockOrders),
          }),
        }),
      };
      const mockOrdersFromChain = {
        where: jest.fn().mockReturnValue(mockWhereResult),
      };
      const mockOrdersChainWithWhere = {
        from: jest.fn().mockReturnValue(mockOrdersFromChain),
      };

      const mockOrderItemsChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCountChainWithWhere) // Count query (with where)
        .mockReturnValueOnce(mockOrdersChainWithWhere) // Orders query (with where)
        .mockReturnValueOnce(mockOrderItemsChain); // Order items query

      await service.getAllOrders(mockQuery);

      expect(db.select).toHaveBeenCalled();
    });
  });

  describe("getAllCustomers", () => {
    it("should return paginated customers without search", async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
      };

      const mockCustomers = [
        {
          id: "customer-1",
          userId: "user-1",
          email: "test@example.com",
          phone: "+919876543210",
          name: "Test Customer",
          gstin: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock count query (no where condition)
      const mockCountChain = {
        from: jest.fn().mockResolvedValue(mockCustomers),
      };

      // Mock customers query with pagination (no where condition)
      // The ternary: db.select().from(customers)
      // So: select() -> from() -> limit() -> offset() -> orderBy() -> await
      const mockFromResult = {
        limit: jest.fn().mockReturnValue({
          offset: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockCustomers),
          }),
        }),
      };
      const mockCustomersChain = {
        from: jest.fn().mockReturnValue(mockFromResult),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCountChain) // Count query
        .mockReturnValueOnce(mockCustomersChain); // Customers query

      const result = await service.getAllCustomers(mockQuery);

      expect(result).toEqual({
        data: mockCustomers,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it("should search customers by name, email, or phone", async () => {
      const mockQuery = {
        page: 1,
        limit: 10,
        search: "test@example.com",
      };

      const mockCustomers = [];
      // Mock count query (with where condition)
      const mockCountFromChain = {
        where: jest.fn().mockResolvedValue(mockCustomers),
      };
      const mockCountChainWithWhere = {
        from: jest.fn().mockReturnValue(mockCountFromChain),
      };

      // Mock customers query with where condition
      const mockWhereResult = {
        limit: jest.fn().mockReturnValue({
          offset: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockCustomers),
          }),
        }),
      };
      const mockCustomersFromChain = {
        where: jest.fn().mockReturnValue(mockWhereResult),
      };
      const mockCustomersChainWithWhere = {
        from: jest.fn().mockReturnValue(mockCustomersFromChain),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCountChainWithWhere) // Count query (with where)
        .mockReturnValueOnce(mockCustomersChainWithWhere); // Customers query (with where)

      await service.getAllCustomers(mockQuery);

      expect(db.select).toHaveBeenCalled();
    });
  });

  describe("getStats", () => {
    it("should return dashboard statistics", async () => {
      const mockProducts = [
        { id: "1", status: "active" },
        { id: "2", status: "active" },
        { id: "3", status: "draft" },
      ];

      const mockOrders = [
        {
          id: "1",
          status: "pending",
          total: 1000,
          createdAt: new Date(),
        },
        {
          id: "2",
          status: "delivered",
          total: 2000,
          createdAt: new Date(),
        },
        {
          id: "3",
          status: "pending",
          total: 1500,
          createdAt: new Date(),
        },
      ];

      const mockCustomers = [
        { id: "1" },
        { id: "2" },
      ];

      // getStats makes 3 separate calls: db.select().from(table) -> await -> array
      // So: select() -> from() -> await resolves to array directly
      const mockProductsChain = {
        from: jest.fn().mockResolvedValue(mockProducts),
      };

      const mockOrdersChain = {
        from: jest.fn().mockResolvedValue(mockOrders),
      };

      const mockCustomersChain = {
        from: jest.fn().mockResolvedValue(mockCustomers),
      };

      (db.select as jest.Mock)
        .mockReturnValueOnce(mockProductsChain)
        .mockReturnValueOnce(mockOrdersChain)
        .mockReturnValueOnce(mockCustomersChain);

      const result = await service.getStats();

      expect(result).toEqual({
        totalProducts: 3,
        activeProducts: 2,
        totalOrders: 3,
        pendingOrders: 2,
        totalCustomers: 2,
        totalRevenue: 4500,
        monthlyRevenue: expect.any(Number),
        averageOrderValue: 1500,
      });
    });
  });

  describe("bulkProductOperation", () => {
    it("should activate products", async () => {
      const mockDto = {
        productIds: ["product-1", "product-2"],
        operation: BulkProductOperation.ACTIVATE,
      };

      const mockProducts = [
        { id: "product-1" },
        { id: "product-2" },
      ];

      // bulkProductOperation: db.select().from(products).where(...) -> await -> array
      // So: select() -> from() -> where() -> await resolves to array
      const mockFromChain = {
        where: jest.fn().mockResolvedValue(mockProducts),
      };
      const mockSelectChain = {
        from: jest.fn().mockReturnValue(mockFromChain),
      };

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      };

      (db.select as jest.Mock).mockReturnValue(mockSelectChain);
      (db.update as jest.Mock).mockReturnValue(mockUpdateChain);

      const result = await service.bulkProductOperation(mockDto);

      expect(result).toEqual({
        affected: 2,
        operation: "activate",
        message: "Successfully activated 2 product(s)",
      });
    });

    it("should archive products", async () => {
      const mockDto = {
        productIds: ["product-1"],
        operation: BulkProductOperation.ARCHIVE,
      };

      const mockProducts = [{ id: "product-1" }];

      // bulkProductOperation: db.select().from(products).where(...) -> await -> array
      const mockFromChain = {
        where: jest.fn().mockResolvedValue(mockProducts),
      };
      const mockSelectChain = {
        from: jest.fn().mockReturnValue(mockFromChain),
      };

      // db.update(products).set(...).where(...) -> await
      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      };

      (db.select as jest.Mock).mockReturnValue(mockSelectChain);
      (db.update as jest.Mock).mockReturnValue(mockUpdateChain);

      const result = await service.bulkProductOperation(mockDto);

      expect(result).toEqual({
        affected: 1,
        operation: "archive",
        message: "Successfully archived 1 product(s)",
      });
    });

    it("should delete products", async () => {
      const mockDto = {
        productIds: ["product-1"],
        operation: BulkProductOperation.DELETE,
      };

      const mockProducts = [{ id: "product-1" }];

      // bulkProductOperation: db.select().from(products).where(...) -> await -> array
      const mockFromChain = {
        where: jest.fn().mockResolvedValue(mockProducts),
      };
      const mockSelectChain = {
        from: jest.fn().mockReturnValue(mockFromChain),
      };

      // db.delete(products).where(...) -> await
      const mockDeleteChain = {
        where: jest.fn().mockResolvedValue(undefined),
      };

      (db.select as jest.Mock).mockReturnValue(mockSelectChain);
      (db.delete as jest.Mock).mockReturnValue(mockDeleteChain);

      const result = await service.bulkProductOperation(mockDto);

      expect(result).toEqual({
        affected: 1,
        operation: "delete",
        message: "Successfully deleted 1 product(s)",
      });
    });

    it("should throw error when products not found", async () => {
      const mockDto = {
        productIds: ["product-1", "product-2"],
        operation: BulkProductOperation.ACTIVATE,
      };

      const mockProducts = [{ id: "product-1" }]; // Only one found

      // bulkProductOperation: db.select().from(products).where(...) -> await -> array
      const mockFromChain = {
        where: jest.fn().mockResolvedValue(mockProducts),
      };
      const mockSelectChain = {
        from: jest.fn().mockReturnValue(mockFromChain),
      };

      (db.select as jest.Mock).mockReturnValue(mockSelectChain);

      await expect(service.bulkProductOperation(mockDto)).rejects.toThrow(
        "Some products not found",
      );
    });
  });
});
