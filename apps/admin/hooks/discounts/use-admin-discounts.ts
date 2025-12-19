"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { PaginatedDiscountsResponse, DiscountQueryParams } from "@/lib/types/discounts";

export function useAdminDiscounts(params?: DiscountQueryParams) {
  return useApiQuery<PaginatedDiscountsResponse>(endpoints.discounts.list, {
    params: params as Record<string, string | number | boolean | undefined>,
    enabled: true,
  });
}

