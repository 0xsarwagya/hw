import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useOrderMutations } from "@/hooks/use-order-mutations";
import { adminApi, OrderStatus } from "@/lib/api";

// Mock the API
jest.mock("@/lib/api", () => ({
  adminApi: {
    updateOrderStatus: jest.fn(),
  },
  OrderStatus: {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    PROCESSING: "processing",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
    REFUNDED: "refunded",
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useOrderMutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update order status successfully", async () => {
    const mockResponse = { message: "Status updated successfully" };
    (adminApi.updateOrderStatus as jest.MockedFunction<typeof adminApi.updateOrderStatus>).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useOrderMutations(), {
      wrapper: createWrapper(),
    });

    result.current.updateOrderStatus.mutate({
      id: "order-1",
      status: OrderStatus.CONFIRMED,
    });

    await waitFor(() => {
      expect(result.current.updateOrderStatus.isSuccess).toBe(true);
    });

    expect(result.current.updateOrderStatus.data).toEqual(mockResponse);
    expect(adminApi.updateOrderStatus).toHaveBeenCalledWith("order-1", OrderStatus.CONFIRMED);
  });

  it("should handle update errors", async () => {
    const error = new Error("Update failed");
    (adminApi.updateOrderStatus as jest.MockedFunction<typeof adminApi.updateOrderStatus>).mockRejectedValue(error);

    const { result } = renderHook(() => useOrderMutations(), {
      wrapper: createWrapper(),
    });

    result.current.updateOrderStatus.mutate({
      id: "order-1",
      status: OrderStatus.SHIPPED,
    });

    await waitFor(() => {
      expect(result.current.updateOrderStatus.isError).toBe(true);
    });

    expect(result.current.updateOrderStatus.error).toEqual(error);
  });

  it("should invalidate queries on successful update", async () => {
    const mockResponse = { message: "Status updated successfully" };
    (adminApi.updateOrderStatus as jest.MockedFunction<typeof adminApi.updateOrderStatus>).mockResolvedValue(mockResponse);

    const queryClient = new QueryClient();
    const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

    const TestWrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useOrderMutations(), {
      wrapper: TestWrapper,
    });

    result.current.updateOrderStatus.mutate({
      id: "order-1",
      status: OrderStatus.DELIVERED,
    });

    await waitFor(() => {
      expect(result.current.updateOrderStatus.isSuccess).toBe(true);
    });

    // Check that invalidateQueries was called for the expected query keys
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "orders"],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "orders", "order-1"],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "orders", "recent"],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "stats"],
    });
  });
});
