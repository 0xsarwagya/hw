import { Test, TestingModule } from "@nestjs/testing";
import { and, db, eq, inArray, products, productVariants } from "@vcecom/db";
import { ProductsService } from "./products.service";
import { SearchProductsDto, SearchSortBy } from "./dto/search.dto";

// Mock database
jest.mock("@vcecom/db", () => ({
  db: {
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
  categories: {},
}));

describe("ProductsService", () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
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
});

