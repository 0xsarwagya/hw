import { screen, waitFor } from "@testing-library/react";
import { renderWithQueryClient } from "@/__tests__/utils/test-utils";
import { ProductList } from "@/components/products/product-list";
import { adminApi } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  adminApi: {
    getProducts: jest.fn(),
  },
}));

const mockedAdminApi = adminApi as jest.Mocked<typeof adminApi>;

describe("ProductList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders product list with data", async () => {
    const mockProducts = {
      data: [
        {
          id: "1",
          title: "Test Product",
          description: "Test Description",
          price: 1000,
          gstRate: 18,
          gstAmount: 180,
          priceExcludingGst: 1000,
          priceIncludingGst: 1180,
          hsnCode: "1234",
          status: "active" as const,
          categoryId: null,
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    mockedAdminApi.getProducts.mockResolvedValue(mockProducts);

    renderWithQueryClient(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText("Test Product")).toBeInTheDocument();
    });

    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Add Product")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockedAdminApi.getProducts.mockImplementation(
      () => new Promise(() => {}),
    );

    renderWithQueryClient(<ProductList />);

    expect(screen.getByText("Products")).toBeInTheDocument();
  });

  it("shows error state", async () => {
    mockedAdminApi.getProducts.mockRejectedValue(new Error("API Error"));

    renderWithQueryClient(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load products/)).toBeInTheDocument();
    });
  });

  it("shows empty state when no products", async () => {
    mockedAdminApi.getProducts.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });

    renderWithQueryClient(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText("No products found")).toBeInTheDocument();
    });
  });
});

