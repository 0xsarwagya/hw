"use client";

import { endpoints } from "@/lib/endpoints";
import type {
  InventoryQueryParams,
  PaginatedInventoryResponse,
} from "@/lib/types/inventory";
import { useApiQuery } from "../use-api-query";

/**
 * Hook for fetching paginated list of inventory items
 *
 * @param params - Optional query parameters for filtering and pagination
 * @returns Query result with inventory data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useInventoryList({
 *   page: 1,
 *   limit: 10,
 *   search: "TSHIRT",
 *   lowStock: true,
 * });
 * ```
 */
export function useInventoryList(params?: InventoryQueryParams) {
  return useApiQuery<PaginatedInventoryResponse>(endpoints.inventory.list, {
    params: params as Record<string, string | number | boolean | undefined>,
    enabled: true,
  });
}
