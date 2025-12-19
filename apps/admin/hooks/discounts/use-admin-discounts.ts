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
