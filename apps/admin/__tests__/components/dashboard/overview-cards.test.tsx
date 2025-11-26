import { render, screen } from "@testing-library/react";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { AdminStats } from "@/lib/api";

describe("OverviewCards", () => {
  const mockStats: AdminStats = {
    totalProducts: 150,
    activeProducts: 120,
    totalOrders: 500,
    pendingOrders: 25,
    totalCustomers: 200,
    totalRevenue: 500000,
    monthlyRevenue: 50000,
    averageOrderValue: 2500,
  };

  it("renders loading state correctly", () => {
    render(<OverviewCards stats={null} isLoading={true} />);
    // Check for skeleton loaders
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders stats correctly when loaded", () => {
    render(<OverviewCards stats={mockStats} isLoading={false} />);

    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("Monthly Revenue")).toBeInTheDocument();
    expect(screen.getByText("Total Orders")).toBeInTheDocument();
    expect(screen.getByText("Total Products")).toBeInTheDocument();
    expect(screen.getByText("Total Customers")).toBeInTheDocument();
    expect(screen.getByText("Average Order Value")).toBeInTheDocument();
  });

  it("displays formatted currency values", () => {
    render(<OverviewCards stats={mockStats} isLoading={false} />);

    // Check that revenue values are formatted as currency
    const totalRevenue = screen.getByText(/₹5,00,000/);
    expect(totalRevenue).toBeInTheDocument();
  });

  it("displays order and product counts", () => {
    render(<OverviewCards stats={mockStats} isLoading={false} />);

    expect(screen.getByText("500")).toBeInTheDocument(); // Total Orders
    expect(screen.getByText("150")).toBeInTheDocument(); // Total Products
    expect(screen.getByText("200")).toBeInTheDocument(); // Total Customers
  });

  it("displays pending orders count", () => {
    render(<OverviewCards stats={mockStats} isLoading={false} />);

    expect(screen.getByText("25 pending")).toBeInTheDocument();
  });

  it("displays active products count", () => {
    render(<OverviewCards stats={mockStats} isLoading={false} />);

    expect(screen.getByText("120 active")).toBeInTheDocument();
  });
});

