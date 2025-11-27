import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useOrders, useOrder } from "@/hooks/use-orders";
import { adminApi, OrderStatus } from "@/lib/api";

// Mock the API
jest.mock("@/lib/api", () => ({
  adminApi: {
    getOrders: jest.fn(),
    getOrder: jest.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useOrders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch orders with default params", async () => {
    const mockOrdersResponse = {
      data: [
        {
          id: "order-1",
          orderNumber: "ORD-001",
          customerId: "customer-1",
          status: "pending",
          subtotal: 80,
          gstAmount: 15,
          shippingCost: 5,
          total: 100,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    (adminApi.getOrders as jest.MockedFunction<typeof adminApi.getOrders>).mockResolvedValue(mockOrdersResponse);

    const { result } = renderHook(() => useOrders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockOrdersResponse);
    expect(adminApi.getOrders).toHaveBeenCalledWith(undefined);
  });

  it("should fetch orders with custom params", async () => {
    const params = {
      page: 2,
      limit: 20,
      status: OrderStatus.CONFIRMED,
    };

    const mockOrdersResponse = {
      data: [],
      total: 0,
      page: 2,
      limit: 20,
      totalPages: 0,
    };

    (adminApi.getOrders as jest.MockedFunction<typeof adminApi.getOrders>).mockResolvedValue(mockOrdersResponse);

    const { result } = renderHook(() => useOrders(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockOrdersResponse);
    expect(adminApi.getOrders).toHaveBeenCalledWith(params);
  });

  it("should handle errors", async () => {
    const error = new Error("API Error");
    (adminApi.getOrders as jest.MockedFunction<typeof adminApi.getOrders>).mockRejectedValue(error);

    const { result } = renderHook(() => useOrders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe("useOrder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch a single order", async () => {
    const orderId = "order-1";
    const mockOrder = {
      id: orderId,
      orderNumber: "ORD-001",
      customerId: "customer-1",
      status: "pending",
      subtotal: 80,
      gstAmount: 15,
      shippingCost: 5,
      total: 100,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };

    (adminApi.getOrder as jest.MockedFunction<typeof adminApi.getOrder>).mockResolvedValue(mockOrder);

    const { result } = renderHook(() => useOrder(orderId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockOrder);
    expect(adminApi.getOrder).toHaveBeenCalledWith(orderId);
  });

  it("should not fetch when orderId is empty", () => {
    const { result } = renderHook(() => useOrder(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(adminApi.getOrder).not.toHaveBeenCalled();
  });

  it("should handle errors", async () => {
    const orderId = "order-1";
    const error = new Error("API Error");
    (adminApi.getOrder as jest.MockedFunction<typeof adminApi.getOrder>).mockRejectedValue(error);

    const { result } = renderHook(() => useOrder(orderId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});
