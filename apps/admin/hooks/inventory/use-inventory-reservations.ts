"use client";

import { endpoints } from "@/lib/endpoints";
import type { InventoryReservations } from "@/lib/types/inventory";
import { useApiQuery } from "../use-api-query";

/**
 * Hook for fetching real-time inventory reservations for a variant
 * Polls every 10 seconds for real-time updates
 *
 * @param variantId - Variant ID to fetch reservations for
 * @param enabled - Whether the query should be enabled (default: true)
 * @returns Query result with reservations data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useInventoryReservations(variantId);
 * ```
 */
export function useInventoryReservations(variantId: string, enabled = true) {
  return useApiQuery<InventoryReservations>(
    endpoints.inventory.reservations(variantId),
    {
      enabled: enabled && !!variantId,
      refetchInterval: 10000, // Poll every 10 seconds
    },
  );
}
