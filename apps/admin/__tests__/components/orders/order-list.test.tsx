import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrderList } from "@/components/orders/order-list";
import { useOrders } from "@/hooks/use-orders";

// Mock the hooks
jest.mock("@/hooks/use-orders", () => ({
  useOrders: jest.fn(),
}));

jest.mock("@/hooks/use-order-mutations", () => ({
  useOrderMutations: jest.fn(() => ({
    updateOrderStatus: {
      mutateAsync: jest.fn(),
      isPending: false,
    },
  })),
}));

// Mock next/link
jest.mock("next/link", () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock toast provider
jest.mock("@/components/providers/toast-provider", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
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
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe("OrderList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOrdersData = {
    data: [
      {
        id: "order-1",
        orderNumber: "ORD-001",
        customerId: "customer-1",
        status: "pending",
        subtotal: 100,
        gstAmount: 18,
        shippingCost: 20,
        total: 138,
        createdAt: "2025-01-15T10:00:00Z",
        updatedAt: "2025-01-15T10:00:00Z",
      },
      {
        id: "order-2",
        orderNumber: "ORD-002",
        customerId: "customer-2",
        status: "delivered",
        subtotal: 200,
        gstAmount: 36,
        shippingCost: 0,
        total: 236,
        createdAt: "2025-01-14T10:00:00Z",
        updatedAt: "2025-01-14T10:00:00Z",
      },
    ],
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  it("should render loading skeleton when loading", () => {
    (useOrders as any).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    const { container } = render(<OrderList />, { wrapper: createWrapper() });

    // Check for skeleton elements
    const skeletons = container.querySelectorAll('[data-testid="skeleton"], .animate-pulse, [class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render error message when there's an error", () => {
    const errorMessage = "Failed to load orders";
    (useOrders as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error(errorMessage),
    });

    render(<OrderList />, { wrapper: createWrapper() });

    expect(screen.getByText("Failed to load orders. Please try again.")).toBeInTheDocument();
  });

  it("should render orders table with data", () => {
    (useOrders as any).mockReturnValue({
      data: mockOrdersData,
      isLoading: false,
      error: null,
    });

    render(<OrderList />, { wrapper: createWrapper() });

    // Check table headers
    expect(screen.getByText("Order #")).toBeInTheDocument();
    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();

    // Check order data
    expect(screen.getByText("ORD-001")).toBeInTheDocument();
    expect(screen.getByText("ORD-002")).toBeInTheDocument();
    expect(screen.getByText("₹138.00")).toBeInTheDocument();
    expect(screen.getByText("₹236.00")).toBeInTheDocument();

    // Check status badges
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
  });

  it("should render empty state when no orders found", () => {
    (useOrders as any).mockReturnValue({
      data: {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
      isLoading: false,
      error: null,
    });

    render(<OrderList />, { wrapper: createWrapper() });

    expect(screen.getByText("No orders found")).toBeInTheDocument();
  });

  it("should render pagination when there are multiple pages", () => {
    const paginatedData = {
      ...mockOrdersData,
      total: 25,
      totalPages: 3,
    };

    (useOrders as any).mockReturnValue({
      data: paginatedData,
      isLoading: false,
      error: null,
    });

    render(<OrderList />, { wrapper: createWrapper() });

    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("should call useOrders with correct parameters", () => {
    const mockUseOrders = jest.fn().mockReturnValue({
      data: mockOrdersData,
      isLoading: false,
      error: null,
    });

    (useOrders as any).mockImplementation(mockUseOrders);

    render(<OrderList page={2} limit={20} />, { wrapper: createWrapper() });

    expect(mockUseOrders).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      status: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  });

  it("should show view link for each order", () => {
    (useOrders as any).mockReturnValue({
      data: mockOrdersData,
      isLoading: false,
      error: null,
    });

    render(<OrderList />, { wrapper: createWrapper() });

    const viewLinks = screen.getAllByText("View");
    expect(viewLinks).toHaveLength(2);

    // Check that links have correct hrefs
    const links = screen.getAllByRole("link");
    const orderLinks = links.filter(link => link.getAttribute("href")?.includes("/orders/"));
    expect(orderLinks).toHaveLength(2);
  });
});
