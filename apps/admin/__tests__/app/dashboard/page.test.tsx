import { screen, waitFor } from "@testing-library/react";
import { renderWithQueryClient } from "@/__tests__/utils/test-utils";
import DashboardPage from "@/app/dashboard/page";
import { adminApi } from "@/lib/api";

jest.mock("@/components/layout/header", () => ({
  Header: () => <div>Header</div>,
}));

// Mock the API
jest.mock("@/lib/api", () => ({
  adminApi: {
    getStats: jest.fn(),
    getRecentOrders: jest.fn(),
  },
}));

const mockedAdminApi = adminApi as jest.Mocked<typeof adminApi>;

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders dashboard title", async () => {
    mockedAdminApi.getStats.mockResolvedValue({
      totalProducts: 150,
      activeProducts: 120,
      totalOrders: 500,
      pendingOrders: 25,
      totalCustomers: 200,
      totalRevenue: 500000,
      monthlyRevenue: 50000,
      averageOrderValue: 2500,
    });

    mockedAdminApi.getRecentOrders.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 5,
      totalPages: 0,
    });

    renderWithQueryClient(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Overview of your ecommerce platform"),
    ).toBeInTheDocument();
  });

  it("displays error message on API failure", async () => {
    mockedAdminApi.getStats.mockRejectedValue(new Error("API Error"));
    mockedAdminApi.getRecentOrders.mockRejectedValue(new Error("API Error"));

    renderWithQueryClient(<DashboardPage />);

    await waitFor(
      () => {
        expect(screen.getByText("Error")).toBeInTheDocument();
        expect(
          screen.getByText("Failed to load dashboard data"),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("fetches stats and orders on mount", async () => {
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

    mockedAdminApi.getStats.mockResolvedValue(mockStats);
    mockedAdminApi.getRecentOrders.mockResolvedValue(mockOrders);

    renderWithQueryClient(<DashboardPage />);

    await waitFor(() => {
      expect(mockedAdminApi.getStats).toHaveBeenCalled();
      expect(mockedAdminApi.getRecentOrders).toHaveBeenCalledWith(5);
    });
  });
});

