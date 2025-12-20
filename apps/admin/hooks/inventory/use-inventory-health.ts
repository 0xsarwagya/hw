"use client";

import { endpoints } from "@/lib/endpoints";
import type { InventoryHealth } from "@/lib/types/inventory";
import { useApiQuery } from "../use-api-query";

/**
 * Hook for fetching inventory health dashboard metrics
 *
 * @returns Query result with health metrics data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useInventoryHealth();
 * ```
 */
export function useInventoryHealth() {
  return useApiQuery<InventoryHealth>(endpoints.inventory.health, {
    enabled: true,
  });
}
