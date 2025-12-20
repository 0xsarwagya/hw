"use client";

import { endpoints } from "@/lib/endpoints";
import type { InventorySettings } from "@/lib/types/inventory";
import { useApiQuery } from "../use-api-query";

/**
 * Hook for fetching inventory settings
 *
 * @returns Query result with settings data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useInventorySettings();
 * ```
 */
export function useInventorySettings() {
  return useApiQuery<InventorySettings>(endpoints.inventory.settings, {
    enabled: true,
  });
}
