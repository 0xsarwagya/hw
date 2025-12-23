import { Test, TestingModule } from "@nestjs/testing";
import {
  customers,
  db,
  eq,
  orderItems,
  orders,
  products,
} from "@vcecom/db";
import { getCommonTestProviders } from "../../common/testing/test-helpers";
import { ProductsService } from "../products/products.service";
import { CartsService } from "../carts/carts.service";
import { AdminService } from "./admin.service";
import { BulkProductOperation } from "./dto/bulk-operations.dto";
import { OrderStatus } from "./dto/admin-orders.dto";
import { CheckoutStore } from "../redis-store/stores/checkout-store";
import { RedisStoreService } from "../redis-store/redis-store.service";

// Mock database module
jest.mock("@vcecom/db", () => ({
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
  sql: jest.fn((strings, ...values) => {
    // Return a mock SQL template tag function
    const template = Object.assign(
      (strings: TemplateStringsArray, ...values: any[]) => strings[0],
      { raw: strings }
    );
    return template;
  }),
  customers: {},
  orders: {},
  orderItems: {},
  products: {},
  addresses: {},
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
    const mockCartsService = {
      getCart: jest.fn(),
      getCartById: jest.fn(),
    };

    const mockCheckoutStore = {
      getSession: jest.fn(),
      createSession: jest.fn(),
    };

    const mockRedisStoreService = {
      getClient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: CartsService,
          useValue: mockCartsService,
        },
        {
          provide: CheckoutStore,
          useValue: mockCheckoutStore,
        },
        {
          provide: RedisStoreService,
          useValue: mockRedisStoreService,
        },
        ...getCommonTestProviders(),
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
    it.skip("should return paginated orders without filters", async () => {
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
          archived: false,
          archivedAt: null,
          archivedBy: null,
          billingAddressId: undefined,
          shippingAddressId: undefined,
          paymentFee: undefined,
          paymentFeeBreakdown: null,
          paymentMethod: null,
          razorpayOrderId: null,
          shippingProvider: null,
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
          gstRate: 18,
        },
      ];

      // Mock count query (supports where condition)
      // The count query returns [{ count: number }]
      // Structure: db.select({ count: sql... }).from(orders).where(whereCondition)
      const mockCountChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      };

      // Mock orders query with pagination (supports where condition)
      const mockOrdersChain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockReturnValue({
                orderBy: jest.fn().mockResolvedValue(mockOrders),
              }),
            }),
          }),
          // Also support direct limit/offset/orderBy for backward compatibility
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

      const mockAddressesChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{ state: "Maharashtra" }]), // Mock shipping address
        }),
      };

      // Reset the mock before setting up
      (db.select as jest.Mock).mockReset();
      
      // Use mockReturnValueOnce for each query in order
      (db.select as jest.Mock)
        .mockReturnValueOnce(mockCountChain) // Count query
        .mockReturnValueOnce(mockOrdersChain) // Orders query
        .mockReturnValueOnce(mockOrderItemsChain) // Order items query
        .mockReturnValue(mockAddressesChain); // Addresses query (can be called multiple times)

      const result = await service.getAllOrders(mockQuery);

      expect(result).toEqual({
        data: [
          {
            ...mockOrders[0],
            gstBreakdown: {
              cgst: 90,
              sgst: 90,
              igst: 0,
              totalGst: 180,
              isIntraState: true,
            },
            items: mockOrderItems,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
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
      const mockOffsetResult = {
        orderBy: jest.fn().mockResolvedValue(mockCustomers),
      };
      const mockLimitResult = {
        offset: jest.fn().mockReturnValue(mockOffsetResult),
      };
      const mockFromResult = {
        limit: jest.fn().mockReturnValue(mockLimitResult),
      };
      const mockCustomersChain = {
        from: jest.fn().mockReturnValue(mockFromResult),
      };

      let selectCallCount = 0;
      (db.select as jest.Mock).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) return mockCountChain; // Count query
        return mockCustomersChain; // Customers query
      });

      const result = await service.getAllCustomers(mockQuery);

      expect(result).toEqual({
        data: mockCustomers,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
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

      let selectCallCount = 0;
      (db.select as jest.Mock).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) return mockProductsChain;
        if (selectCallCount === 2) return mockOrdersChain;
        return mockCustomersChain;
      });

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
        from: jest.fn().mockImplementation(() => mockFromChain),
      };

      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      };

      (db.select as jest.Mock).mockImplementation(() => mockSelectChain);
      (db.update as jest.Mock).mockImplementation(() => mockUpdateChain);

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
        from: jest.fn().mockImplementation(() => mockFromChain),
      };

      // db.update(products).set(...).where(...) -> await
      const mockUpdateChain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      };

      (db.select as jest.Mock).mockImplementation(() => mockSelectChain);
      (db.update as jest.Mock).mockImplementation(() => mockUpdateChain);

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
        from: jest.fn().mockImplementation(() => mockFromChain),
      };

      // db.delete(products).where(...) -> await
      const mockDeleteChain = {
        where: jest.fn().mockResolvedValue(undefined),
      };

      (db.select as jest.Mock).mockImplementation(() => mockSelectChain);
      (db.delete as jest.Mock).mockImplementation(() => mockDeleteChain);

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
        from: jest.fn().mockImplementation(() => mockFromChain),
      };

      (db.select as jest.Mock).mockImplementation(() => mockSelectChain);

      await expect(service.bulkProductOperation(mockDto)).rejects.toThrow(
        "Some products not found",
      );
    });
  });
});
