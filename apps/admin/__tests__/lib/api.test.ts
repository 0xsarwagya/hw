import { adminApi, ApiError } from "@/lib/api";

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("adminApi", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Clear localStorage
    localStorage.clear();
  });

  describe("getStats", () => {
    it("fetches stats successfully", async () => {
      const mockStats = {
        totalProducts: 150,
        activeProducts: 120,
        totalOrders: 500,
        pendingOrders: 25,
        totalCustomers: 200,
        totalRevenue: 500000,
        monthlyRevenue: 50000,
        averageOrderValue: 2500,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      } as Response);

      const result = await adminApi.getStats();

      expect(result).toEqual(mockStats);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/stats"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("makes request with correct options", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await adminApi.getStats();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("throws ApiError on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      } as Response);

      await expect(adminApi.getStats()).rejects.toThrow(ApiError);
    });
  });

  describe("getRecentOrders", () => {
    it("fetches recent orders successfully", async () => {
      const mockOrders = {
        data: [],
        total: 0,
        page: 1,
        limit: 5,
        totalPages: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrders,
      } as Response);

      const result = await adminApi.getRecentOrders(5);

      expect(result).toEqual(mockOrders);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/orders?page=1&limit=5"),
        expect.any(Object),
      );
    });

    it("uses default limit of 5", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          total: 0,
          page: 1,
          limit: 5,
          totalPages: 0,
        }),
      } as Response);

      await adminApi.getRecentOrders();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=5"),
        expect.any(Object),
      );
    });
  });
});

