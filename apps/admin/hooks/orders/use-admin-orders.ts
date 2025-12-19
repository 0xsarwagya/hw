"use client";

import { endpoints } from "@/lib/endpoints";
import type {
  OrderQueryParams,
  PaginatedOrdersResponse,
} from "@/lib/types/orders";
import { useApiQuery } from "../use-api-query";

/**
 * Hook for fetching paginated list of orders
 *
 * @param params - Optional query parameters for filtering and pagination
 * @returns Query result with orders data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useAdminOrders({
 *   page: 1,
 *   limit: 10,
 *   status: "pending",
 * });
 * ```
 */
export function useAdminOrders(params?: OrderQueryParams) {
  // Call backend directly - cookies sent automatically
  return useApiQuery<PaginatedOrdersResponse>(endpoints.orders.list, {
    params: params as Record<string, string | number | boolean | undefined>,
    enabled: true,
  });
}
