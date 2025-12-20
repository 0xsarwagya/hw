"use client";

import { endpoints } from "@/lib/endpoints";
import type { VariantsIndex } from "@/lib/types/inventory";
import { useApiQuery } from "../use-api-query";

/**
 * Hook for fetching variants index (quick SKU/variant map)
 * Useful for autocomplete and dropdowns
 *
 * @returns Query result with variants index data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useVariantsIndex();
 * ```
 */
export function useVariantsIndex() {
  return useApiQuery<VariantsIndex>(endpoints.inventory.variantsIndex, {
    enabled: true,
  });
}
