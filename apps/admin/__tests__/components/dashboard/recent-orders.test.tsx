import { render, screen } from "@testing-library/react";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { Order } from "@/lib/api";

describe("RecentOrders", () => {
  const mockOrders: Order[] = [
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
      items: [
        {
          id: "item-1",
          orderId: "1",
          productVariantId: "variant-1",
          quantity: 2,
          price: 500,
        },
      ],
    },
    {
      id: "2",
      customerId: "customer-2",
      orderNumber: "ORD-2025-001235",
      status: "delivered",
      subtotal: 2000,
      gstAmount: 360,
      shippingCost: 100,
      total: 2460,
      createdAt: "2025-01-14T10:00:00Z",
      updatedAt: "2025-01-14T10:00:00Z",
      items: [],
    },
  ];

  it("renders loading state correctly", () => {
    render(<RecentOrders orders={null} isLoading={true} />);
    expect(screen.getByText("Recent Orders")).toBeInTheDocument();
    // Check for skeleton loaders
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders empty state when no orders", () => {
    render(<RecentOrders orders={[]} isLoading={false} />);
    expect(screen.getByText("Recent Orders")).toBeInTheDocument();
    expect(screen.getByText("No orders found")).toBeInTheDocument();
  });

  it("renders orders correctly when loaded", () => {
    render(<RecentOrders orders={mockOrders} isLoading={false} />);

    expect(screen.getByText("Recent Orders")).toBeInTheDocument();
    expect(screen.getByText("ORD-2025-001234")).toBeInTheDocument();
    expect(screen.getByText("ORD-2025-001235")).toBeInTheDocument();
  });

  it("displays order status badges", () => {
    render(<RecentOrders orders={mockOrders} isLoading={false} />);

    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("delivered")).toBeInTheDocument();
  });

  it("displays formatted order totals", () => {
    render(<RecentOrders orders={mockOrders} isLoading={false} />);

    expect(screen.getByText(/₹1,230/)).toBeInTheDocument();
    expect(screen.getByText(/₹2,460/)).toBeInTheDocument();
  });

  it("displays item counts", () => {
    render(<RecentOrders orders={mockOrders} isLoading={false} />);

    expect(screen.getByText("1 items")).toBeInTheDocument();
    expect(screen.getByText("0 items")).toBeInTheDocument();
  });
});

