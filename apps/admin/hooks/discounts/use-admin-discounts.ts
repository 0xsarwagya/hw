"use client";

import { endpoints } from "@/lib/endpoints";
import type {
  DiscountQueryParams,
  PaginatedDiscountsResponse,
} from "@/lib/types/discounts";
import { useApiQuery } from "../use-api-query";

export function useAdminDiscounts(params?: DiscountQueryParams) {
  return useApiQuery<PaginatedDiscountsResponse>(endpoints.discounts.list, {
    params: params as Record<string, string | number | boolean | undefined>,
    enabled: true,
  });
}

// Note: Preview endpoint may need to be added to backend if not exists
// For now, we'll create a placeholder hook
export function useAdminDiscountPreview() {
  // This would call a preview/simulate endpoint if it exists
  // For now, return a placeholder
  return {
    data: undefined,
    isLoading: false,
    error: null,
    mutate: async () => {
      throw new Error("Preview endpoint not yet implemented");
    },
  };
}
