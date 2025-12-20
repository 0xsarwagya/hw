"use client";

import { endpoints } from "@/lib/endpoints";
import type { InventoryItem } from "@/lib/types/inventory";
import { useApiQuery } from "../use-api-query";

/**
 * Hook for fetching single inventory item details
 *
 * @param variantId - Variant ID to fetch
 * @param enabled - Whether the query should be enabled (default: true)
 * @returns Query result with inventory item data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useInventoryItem(variantId);
 * ```
 */
export function useInventoryItem(variantId: string, enabled = true) {
  return useApiQuery<InventoryItem>(endpoints.inventory.detail(variantId), {
    enabled: enabled && !!variantId,
  });
}
