/**
 * API client for admin dashboard
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface AdminStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageOrderValue: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productVariantId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  gstAmount: number;
  shippingCost: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface PaginatedOrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string,
  ) {
    super(message || statusText);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem("admin_token"); // TODO: Replace with proper auth

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      response.statusText,
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

export const adminApi = {
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<AdminStats> {
    return fetchApi<AdminStats>("/admin/stats");
  },

  /**
   * Get recent orders
   */
  async getRecentOrders(limit = 5): Promise<PaginatedOrdersResponse> {
    return fetchApi<PaginatedOrdersResponse>(
      `/admin/orders?page=1&limit=${limit}`,
    );
  },
};
