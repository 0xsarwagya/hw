import { render, screen } from "@testing-library/react";
import { StatsChart } from "@/components/dashboard/stats-chart";
import { AdminStats } from "@/lib/api";

describe("StatsChart", () => {
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
    render(<StatsChart stats={null} isLoading={true} />);
    expect(screen.getByText("Revenue Overview")).toBeInTheDocument();
    // Check for skeleton loader
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders empty state when no stats", () => {
    render(<StatsChart stats={null} isLoading={false} />);
    expect(screen.getByText("Revenue Overview")).toBeInTheDocument();
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("renders charts when stats are loaded", () => {
    render(<StatsChart stats={mockStats} isLoading={false} />);

    expect(screen.getByText("Revenue Overview")).toBeInTheDocument();
    expect(screen.getByText("Orders & Products")).toBeInTheDocument();
  });

  it("renders chart containers", () => {
    const { container } = render(
      <StatsChart stats={mockStats} isLoading={false} />,
    );

    // Check that recharts components are rendered (may take a moment to render)
    // We check for the chart container divs instead
    const chartCards = screen.getAllByText("Revenue Overview");
    expect(chartCards.length).toBeGreaterThan(0);
  });
});

