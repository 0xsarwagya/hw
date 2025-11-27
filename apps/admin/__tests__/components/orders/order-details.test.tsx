import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrderDetails } from "@/components/orders/order-details";
import { useOrder } from "@/hooks/use-orders";
import { useOrderMutations } from "@/hooks/use-order-mutations";
import { Order, OrderStatus } from "@/lib/api";

// Mock the hooks
jest.mock("@/hooks/use-orders", () => ({
  useOrder: jest.fn(),
}));

jest.mock("@/hooks/use-order-mutations", () => ({
  useOrderMutations: jest.fn(),
}));

jest.mock("@/components/providers/toast-provider", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock UI components
jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <p>{children}</p>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

jest.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <option>{children}</option>,
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: ({ children }: any) => <span>{children}</span>,
}));

jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) => <div className={`skeleton ${className}`} />,
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

describe("OrderDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOrder: Order = {
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
    items: [
      {
        id: "item-1",
        orderId: "order-1",
        productVariantId: "variant-1",
        quantity: 2,
        price: 50,
      },
    ],
  };

  const mockUpdateOrderStatus = jest.fn();

  beforeEach(() => {
    (useOrder as any).mockReturnValue({
      data: mockOrder,
      isLoading: false,
      error: null,
    });

    (useOrderMutations as any).mockReturnValue({
      updateOrderStatus: {
        mutateAsync: mockUpdateOrderStatus,
        isPending: false,
      },
    });
  });

  it("should render loading skeleton when loading", () => {
    (useOrder as any).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    const { container } = render(<OrderDetails orderId="order-1" />, {
      wrapper: createWrapper(),
    });

    // Check for skeleton elements
    const skeletons = container.querySelectorAll('[data-testid="skeleton"], .animate-pulse, [class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render error message when there's an error", () => {
    const errorMessage = "Failed to load order";
    (useOrder as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error(errorMessage),
    });

    render(<OrderDetails orderId="order-1" />, { wrapper: createWrapper() });

    expect(screen.getByText("Failed to load order details. Please try again.")).toBeInTheDocument();
  });

  it.skip("should render order header with correct information", () => {
    render(<OrderDetails orderId="order-1" />, { wrapper: createWrapper() });

    expect(screen.getByText("Order ORD-001")).toBeInTheDocument();
    expect(screen.getAllByText("Pending")).toHaveLength(2); // Badge and select value
  });

  it.skip("should render order items", () => {
    render(<OrderDetails orderId="order-1" />, { wrapper: createWrapper() });

    expect(screen.getByText("Order Items")).toBeInTheDocument();
    expect(screen.getByText(/Product Variant/)).toBeInTheDocument();
    expect(screen.getByText("Quantity: 2")).toBeInTheDocument();
    expect(screen.getByText("₹50.00")).toBeInTheDocument();
    expect(screen.getByText("Total: ₹100.00")).toBeInTheDocument();
  });

  it.skip("should render order summary", () => {
    render(<OrderDetails orderId="order-1" />, { wrapper: createWrapper() });

    expect(screen.getByText("Order Summary")).toBeInTheDocument();
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("₹100.00")).toBeInTheDocument();
    expect(screen.getByText("GST")).toBeInTheDocument();
    expect(screen.getByText("₹18.00")).toBeInTheDocument();
    expect(screen.getAllByText("Shipping")).toHaveLength(2); // Order summary and shipping section
    expect(screen.getByText("₹20.00")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("₹138.00")).toBeInTheDocument();
  });

  it.skip("should render customer information", () => {
    render(<OrderDetails orderId="order-1" />, { wrapper: createWrapper() });

    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(screen.getByText("ID:")).toBeInTheDocument();
    expect(screen.getByText("customer-1")).toBeInTheDocument();
  });

  it.skip("should render shipping information placeholder", () => {
    render(<OrderDetails orderId="order-1" />, { wrapper: createWrapper() });

    expect(screen.getAllByText("Shipping")).toHaveLength(2); // Section header and order summary
    expect(screen.getByText("Shipping details will be displayed here when available")).toBeInTheDocument();
  });

  it("should render payment information placeholder", () => {
    render(<OrderDetails orderId="order-1" />, { wrapper: createWrapper() });

    expect(screen.getByText("Payment")).toBeInTheDocument();
    expect(screen.getByText("Payment details will be displayed here when available")).toBeInTheDocument();
  });

  it("should show order items placeholder when no items", () => {
    const orderWithoutItems = { ...mockOrder, items: undefined };

    (useOrder as any).mockReturnValue({
      data: orderWithoutItems,
      isLoading: false,
      error: null,
    });

    render(<OrderDetails orderId="order-1" />, { wrapper: createWrapper() });

    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("should call useOrder with correct orderId", () => {
    const mockUseOrder = jest.fn().mockReturnValue({
      data: mockOrder,
      isLoading: false,
      error: null,
    });

    (useOrder as any).mockImplementation(mockUseOrder);

    render(<OrderDetails orderId="order-123" />, { wrapper: createWrapper() });

    expect(mockUseOrder).toHaveBeenCalledWith("order-123");
  });

  it.skip("should show status update select", () => {
    render(<OrderDetails orderId="order-1" />, { wrapper: createWrapper() });

    // Should have a select element for status updates
    const selectElements = screen.getAllByRole("combobox");
    expect(selectElements.length).toBeGreaterThan(0);
  });
});
