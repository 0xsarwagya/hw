import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { useAdminStats } from "@/hooks/use-admin-stats";
import { adminApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  adminApi: {
    getStats: jest.fn(),
  },
}));

const mockedAdminApi = adminApi as jest.Mocked<typeof adminApi>;

describe("useAdminStats", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    jest.clearAllMocks();
  });

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

    mockedAdminApi.getStats.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useAdminStats(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockStats);
    expect(mockedAdminApi.getStats).toHaveBeenCalledTimes(1);
  });

  it("handles errors correctly", async () => {
    const error = new Error("API Error");
    mockedAdminApi.getStats.mockRejectedValue(error);

    const { result } = renderHook(() => useAdminStats(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

