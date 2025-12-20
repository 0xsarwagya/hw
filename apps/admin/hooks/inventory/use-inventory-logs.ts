"use client";

import { endpoints } from "@/lib/endpoints";
import type {
  InventoryLogsQueryParams,
  PaginatedInventoryLogsResponse,
} from "@/lib/types/inventory";
import { useApiQuery } from "../use-api-query";

/**
 * Hook for fetching paginated inventory logs for a variant
 *
 * @param variantId - Variant ID to fetch logs for
 * @param params - Optional query parameters for filtering and pagination
 * @returns Query result with logs data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useInventoryLogs(variantId, {
 *   page: 1,
 *   limit: 20,
 *   reason: "received",
 * });
 * ```
 */
export function useInventoryLogs(
  variantId: string,
  params?: InventoryLogsQueryParams,
) {
  return useApiQuery<PaginatedInventoryLogsResponse>(
    endpoints.inventory.logs(variantId),
    {
      params: params as Record<string, string | number | boolean | undefined>,
      enabled: !!variantId,
    },
  );
}
