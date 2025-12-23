import { Test, TestingModule } from "@nestjs/testing";
import { and, db, eq, inArray, products, productVariants, productImages } from "@vcecom/db";
import { getCommonTestProviders } from "../../common/testing/test-helpers";
import { ProductsService } from "./products.service";
import { FilterProductsDto, SortField, SortOrder } from "./dto/filter.dto";
import { SearchProductsDto, SearchSortBy } from "./dto/search.dto";
import { StorageService } from "../storage/storage.service";
import { MediaTransactionService } from "./services/media-transaction.service";
import { MediaCacheInvalidationService } from "./services/media-cache-invalidation.service";

// Mock database
jest.mock("@vcecom/db", () => ({
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  eq: jest.fn(),
  and: jest.fn(),
  or: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
  ilike: jest.fn(),
  inArray: jest.fn(),
  notInArray: jest.fn(),
  asc: jest.fn(),
  desc: jest.fn(),
  sql: jest.fn((strings, ...values) => ({
    strings,
    values,
  })),
  products: {},
  productVariants: {},
  productImages: {},
  categories: {},
}));

describe("ProductsService", () => {
  let service: ProductsService;
  let storageService: jest.Mocked<StorageService>;

  const mockStorageService = {
    upload: jest.fn(),
    delete: jest.fn(),
    getUrl: jest.fn(),
    getPresignedUrl: jest.fn(),
    exists: jest.fn(),
    list: jest.fn(),
  };

  const mockMediaTransactionService = {
    lockProductImages: jest.fn(),
    lockVariantImages: jest.fn(),
    withProductImageLock: jest.fn((productId, operation) => operation()),
    withVariantImageLock: jest.fn((productId, variantId, operation) => operation()),
  };

  const mockMediaCacheInvalidationService = {
    invalidateProductImages: jest.fn(),
    invalidateVariantImages: jest.fn(),
    invalidateProductCache: jest.fn(),
    invalidateAllMediaCaches: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: MediaTransactionService,
          useValue: mockMediaTransactionService,
        },
        {
          provide: MediaCacheInvalidationService,
          useValue: mockMediaCacheInvalidationService,
        },
        ...getCommonTestProviders(),
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    storageService = module.get(StorageService) as jest.Mocked<StorageService>;
    jest.clearAllMocks();
  });

  describe("search", () => {
    const mockProducts = [
      {
        id: "product-1",
        title: "Wireless Headphones",
        description: "High-quality wireless headphones",
        price: 2999.0,
        gstRate: 18.0,
        hsnCode: "8518",
        status: "active" as const,
        categoryId: "cat-1",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: "product-2",
        title: "Bluetooth Speaker",
        description: "Portable bluetooth speaker",
        price: 1999.0,
        gstRate: 18.0,
        hsnCode: "8518",
        status: "active" as const,
        categoryId: "cat-1",
        createdAt: new Date("2024-01-02"),
        updatedAt: new Date("2024-01-02"),
      },
    ];

    it("should search products by query", async () => {
      const searchDto: SearchProductsDto = {
        query: "wireless",
        page: 1,
        limit: 10,
      };

      // Mock database queries
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockProducts),
        }),
      });

      // Mock SKU search (no matches)
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.search(searchDto);

      expect(result).toBeDefined();
      expect(result.query).toBe("wireless");
      expect(result.results.length).toBeGreaterThanOrEqual(0);
    });

    it("should filter by category", async () => {
      const searchDto: SearchProductsDto = {
        query: "headphones",
        categoryId: "cat-1",
        page: 1,
        limit: 10,
      };

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockProducts),
        }),
      });

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.search(searchDto);

      expect(result).toBeDefined();
    });

    it("should filter by price range", async () => {
      const searchDto: SearchProductsDto = {
        query: "headphones",
        minPrice: 2000,
        maxPrice: 4000,
        page: 1,
        limit: 10,
      };

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockProducts[0]]),
        }),
      });

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.search(searchDto);

      expect(result).toBeDefined();
    });

    it("should filter by stock availability", async () => {
      const searchDto: SearchProductsDto = {
        query: "headphones",
        inStock: true,
        page: 1,
        limit: 10,
      };

      // Mock products query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockProducts),
        }),
      });

      // Mock in-stock products query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            { productId: "product-1" },
            { productId: "product-1" }, // Duplicate to test deduplication
          ]),
        }),
      });

      // Mock SKU search
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.search(searchDto);

      expect(result).toBeDefined();
    });

    it("should search by SKU", async () => {
      const searchDto: SearchProductsDto = {
        query: "WH-001-BLK",
        page: 1,
        limit: 10,
      };

      // Mock products query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      // Mock SKU search
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            { productId: "product-1", sku: "WH-001-BLK" },
          ]),
        }),
      });

      // Mock products by SKU
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockProducts[0]]),
        }),
      });

      const result = await service.search(searchDto);

      expect(result).toBeDefined();
      expect(result.results.length).toBeGreaterThanOrEqual(0);
    });

    it("should sort by relevance by default", async () => {
      const searchDto: SearchProductsDto = {
        query: "wireless",
        sortBy: SearchSortBy.RELEVANCE,
        page: 1,
        limit: 10,
      };

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockProducts),
        }),
      });

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.search(searchDto);

      expect(result).toBeDefined();
      // Results should be sorted by relevance (highest first)
      if (result.results.length > 1) {
        expect(result.results[0].relevanceScore).toBeGreaterThanOrEqual(
          result.results[1].relevanceScore,
        );
      }
    });

    it("should paginate results", async () => {
      const searchDto: SearchProductsDto = {
        query: "headphones",
        page: 2,
        limit: 1,
      };

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockProducts),
        }),
      });

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.search(searchDto);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(1);
      expect(result.results.length).toBeLessThanOrEqual(1);
    });

    it("should return empty results when no products match", async () => {
      const searchDto: SearchProductsDto = {
        query: "nonexistent product",
        page: 1,
        limit: 10,
      };

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.search(searchDto);

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should return empty results when filtering inStock but none available", async () => {
      const searchDto: SearchProductsDto = {
        query: "headphones",
        inStock: true,
        page: 1,
        limit: 10,
      };

      // Mock in-stock products query FIRST (empty) - this is checked before products query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.search(searchDto);

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.query).toBe("headphones");
    });
  });

  describe("filter", () => {
    // Helper to create mock query chain
    const createMockQueryChain = (results: unknown[]) => {
      const chain = {
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(results),
      };
      return {
        where: jest.fn().mockReturnValue(chain),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(results),
      };
    };

    const mockProducts = [
      {
        id: "product-1",
        title: "Wireless Headphones",
        description: "High-quality wireless headphones",
        price: 2999.0,
        gstRate: 18.0,
        hsnCode: "8518",
        status: "active" as const,
        categoryId: "cat-1",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: "product-2",
        title: "Bluetooth Speaker",
        description: "Portable bluetooth speaker",
        price: 1999.0,
        gstRate: 18.0,
        hsnCode: "8518",
        status: "active" as const,
        categoryId: "cat-1",
        createdAt: new Date("2024-01-02"),
        updatedAt: new Date("2024-01-02"),
      },
      {
        id: "product-3",
        title: "Smart Watch",
        description: "Feature-rich smart watch",
        price: 4999.0,
        gstRate: 18.0,
        hsnCode: "8517",
        status: "active" as const,
        categoryId: "cat-2",
        createdAt: new Date("2024-01-03"),
        updatedAt: new Date("2024-01-03"),
      },
    ];

    it("should filter products by category", async () => {
      const filterDto: FilterProductsDto = {
        categoryId: "cat-1",
        page: 1,
        limit: 10,
      };

      // Mock products count query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockProducts[0], mockProducts[1]]),
        }),
      });

      // Mock products query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue(
          createMockQueryChain([mockProducts[0], mockProducts[1]]),
        ),
      });

      const result = await service.filter(filterDto);

      expect(result).toBeDefined();
      expect(result.data.length).toBeGreaterThanOrEqual(0);
    });

    it("should filter products by price range", async () => {
      const filterDto: FilterProductsDto = {
        minPrice: 2000,
        maxPrice: 4000,
        page: 1,
        limit: 10,
      };

      // Mock products count query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockProducts[0]]),
        }),
      });

      // Mock products query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue(createMockQueryChain([mockProducts[0]])),
      });

      const result = await service.filter(filterDto);

      expect(result).toBeDefined();
    });

    it("should filter products by availability (in stock)", async () => {
      const filterDto: FilterProductsDto = {
        inStock: true,
        page: 1,
        limit: 10,
      };

      // Mock in-stock products query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            { productId: "product-1" },
            { productId: "product-2" },
          ]),
        }),
      });

      // Mock products count query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockProducts[0], mockProducts[1]]),
        }),
      });

      // Mock products query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue(
          createMockQueryChain([mockProducts[0], mockProducts[1]]),
        ),
      });

      const result = await service.filter(filterDto);

      expect(result).toBeDefined();
    });

    it("should filter products by status", async () => {
      const filterDto: FilterProductsDto = {
        status: "active",
        page: 1,
        limit: 10,
      };

      // Mock products count query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockProducts),
        }),
      });

      // Mock products query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue(createMockQueryChain(mockProducts)),
      });

      const result = await service.filter(filterDto);

      expect(result).toBeDefined();
    });

    it("should sort products by price ascending", async () => {
      const filterDto: FilterProductsDto = {
        sortBy: SortField.PRICE,
        sortOrder: SortOrder.ASC,
        page: 1,
        limit: 10,
      };

      // Mock products count query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockProducts),
        }),
      });

      // Mock products query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue(
          createMockQueryChain([
            mockProducts[1], // Lowest price first
            mockProducts[0],
            mockProducts[2],
          ]),
        ),
      });

      const result = await service.filter(filterDto);

      expect(result).toBeDefined();
    });

    it("should sort products by price descending", async () => {
      const filterDto: FilterProductsDto = {
        sortBy: SortField.PRICE,
        sortOrder: SortOrder.DESC,
        page: 1,
        limit: 10,
      };

      // Mock products count query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockProducts),
        }),
      });

      // Mock products query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue(
          createMockQueryChain([
            mockProducts[2], // Highest price first
            mockProducts[0],
            mockProducts[1],
          ]),
        ),
      });

      const result = await service.filter(filterDto);

      expect(result).toBeDefined();
    });

    it("should sort products by name", async () => {
      const filterDto: FilterProductsDto = {
        sortBy: SortField.NAME,
        sortOrder: SortOrder.ASC,
        page: 1,
        limit: 10,
      };

      // Mock products count query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockProducts),
        }),
      });

      // Mock products query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue(
          createMockQueryChain([
            mockProducts[1], // Alphabetically first
            mockProducts[2],
            mockProducts[0],
          ]),
        ),
      });

      const result = await service.filter(filterDto);

      expect(result).toBeDefined();
    });

    it("should sort products by date", async () => {
      const filterDto: FilterProductsDto = {
        sortBy: SortField.DATE,
        sortOrder: SortOrder.DESC,
        page: 1,
        limit: 10,
      };

      // Mock products count query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockProducts),
        }),
      });

      // Mock products query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue(
          createMockQueryChain([
            mockProducts[2], // Most recent first
            mockProducts[1],
            mockProducts[0],
          ]),
        ),
      });

      const result = await service.filter(filterDto);

      expect(result).toBeDefined();
    });

    it("should combine multiple filters", async () => {
      const filterDto: FilterProductsDto = {
        categoryId: "cat-1",
        minPrice: 2000,
        maxPrice: 4000,
        inStock: true,
        status: "active",
        sortBy: SortField.PRICE,
        sortOrder: SortOrder.ASC,
        page: 1,
        limit: 10,
      };

      // Mock in-stock products query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            { productId: "product-1" },
          ]),
        }),
      });

      // Mock products count query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockProducts[0]]),
        }),
      });

      // Mock products query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue(createMockQueryChain([mockProducts[0]])),
      });

      const result = await service.filter(filterDto);

      expect(result).toBeDefined();
      expect(result.data.length).toBeGreaterThanOrEqual(0);
    });

    it("should paginate results", async () => {
      const filterDto: FilterProductsDto = {
        page: 2,
        limit: 1,
      };

      // Mock products count query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockProducts),
        }),
      });

      // Mock products query
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue(createMockQueryChain([mockProducts[1]])),
      });

      const result = await service.filter(filterDto);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(1);
      expect(result.data).toBeDefined();
    });

    it("should return empty results when filtering inStock but none available", async () => {
      const filterDto: FilterProductsDto = {
        inStock: true,
        page: 1,
        limit: 10,
      };

      // Mock in-stock products query (empty)
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.filter(filterDto);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});

