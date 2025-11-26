import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { useRecentOrders } from "@/hooks/use-recent-orders";
import { adminApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  adminApi: {
    getRecentOrders: jest.fn(),
  },
}));

const mockedAdminApi = adminApi as jest.Mocked<typeof adminApi>;

describe("useRecentOrders", () => {
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

  it("fetches recent orders successfully", async () => {
    const mockOrders = {
      data: [
        {
          id: "1",
          customerId: "customer-1",
          orderNumber: "ORD-2025-001234",
          status: "pending",
          subtotal: 1000,
          gstAmount: 180,
          shippingCost: 50,
          total: 1230,
          createdAt: "2025-01-15T10:00:00Z",
          updatedAt: "2025-01-15T10:00:00Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 5,
      totalPages: 1,
    };

    mockedAdminApi.getRecentOrders.mockResolvedValue(mockOrders);

    const { result } = renderHook(() => useRecentOrders(5), {
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

    expect(result.current.data).toEqual(mockOrders);
    expect(mockedAdminApi.getRecentOrders).toHaveBeenCalledWith(5);
  });

  it("uses default limit of 5", async () => {
    const mockOrders = {
      data: [],
      total: 0,
      page: 1,
      limit: 5,
      totalPages: 0,
    };

    mockedAdminApi.getRecentOrders.mockResolvedValue(mockOrders);

    const { result } = renderHook(() => useRecentOrders(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockedAdminApi.getRecentOrders).toHaveBeenCalledWith(5);
  });

  it("handles errors correctly", async () => {
    const error = new Error("API Error");
    mockedAdminApi.getRecentOrders.mockRejectedValue(error);

    const { result } = renderHook(() => useRecentOrders(5), {
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

