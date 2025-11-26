import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/use-product-mutations";
import { adminApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  adminApi: {
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
  },
}));

jest.mock("@/components/providers/toast-provider", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

const mockedAdminApi = adminApi as jest.Mocked<typeof adminApi>;

describe("useProductMutations", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  describe("useCreateProduct", () => {
    it("creates product successfully", async () => {
      const mockProduct = {
        id: "1",
        title: "New Product",
        description: null,
        price: 1000,
        gstRate: 18,
        gstAmount: 180,
        priceExcludingGst: 1000,
        priceIncludingGst: 1180,
        hsnCode: null,
        status: "draft" as const,
        categoryId: null,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockedAdminApi.createProduct.mockResolvedValue(mockProduct);

      const { result } = renderHook(() => useCreateProduct(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      result.current.mutate({
        title: "New Product",
        price: 1000,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedAdminApi.createProduct).toHaveBeenCalledWith({
        title: "New Product",
        price: 1000,
      });
    });
  });

  describe("useUpdateProduct", () => {
    it("updates product successfully", async () => {
      const mockProduct = {
        id: "1",
        title: "Updated Product",
        description: null,
        price: 2000,
        gstRate: 18,
        gstAmount: 360,
        priceExcludingGst: 2000,
        priceIncludingGst: 2360,
        hsnCode: null,
        status: "active" as const,
        categoryId: null,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockedAdminApi.updateProduct.mockResolvedValue(mockProduct);

      const { result } = renderHook(() => useUpdateProduct(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      result.current.mutate({
        id: "1",
        data: { title: "Updated Product" },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedAdminApi.updateProduct).toHaveBeenCalledWith("1", {
        title: "Updated Product",
      });
    });
  });

  describe("useDeleteProduct", () => {
    it("deletes product successfully", async () => {
      mockedAdminApi.deleteProduct.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteProduct(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      });

      result.current.mutate("1");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockedAdminApi.deleteProduct).toHaveBeenCalledWith("1");
    });
  });
});

