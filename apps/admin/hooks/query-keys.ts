/**
 * Centralized query keys for React Query
 */

export const queryKeys = {
  admin: {
    stats: ["admin", "stats"] as const,
    orders: (page?: number, limit?: number) =>
      ["admin", "orders", page, limit] as const,
    recentOrders: (limit?: number) =>
      ["admin", "orders", "recent", limit] as const,
    products: (page?: number, limit?: number, filters?: unknown) =>
      ["admin", "products", page, limit, filters] as const,
    customers: (page?: number, limit?: number, search?: string) =>
      ["admin", "customers", page, limit, search] as const,
  },
} as const;
