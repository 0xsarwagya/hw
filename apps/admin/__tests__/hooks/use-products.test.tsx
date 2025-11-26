import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { useProducts } from "@/hooks/use-products";
import { adminApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  adminApi: {
    getProducts: jest.fn(),
  },
}));

const mockedAdminApi = adminApi as jest.Mocked<typeof adminApi>;

describe("useProducts", () => {
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

  it("fetches products successfully", async () => {
    const mockProducts = {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };

    mockedAdminApi.getProducts.mockResolvedValue(mockProducts);

    const { result } = renderHook(() => useProducts(), {
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

    expect(result.current.data).toEqual(mockProducts);
    expect(mockedAdminApi.getProducts).toHaveBeenCalledTimes(1);
  });

  it("handles errors correctly", async () => {
    const error = new Error("API Error");
    mockedAdminApi.getProducts.mockRejectedValue(error);

    const { result } = renderHook(() => useProducts(), {
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

