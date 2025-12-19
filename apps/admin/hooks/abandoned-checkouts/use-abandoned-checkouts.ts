"use client";

import { endpoints } from "@/lib/endpoints";
import type {
  AbandonedCheckoutQueryParams,
  PaginatedAbandonedCheckoutsResponse,
} from "@/lib/types/abandoned-checkouts";
import { useApiQuery } from "../use-api-query";

export function useAbandonedCheckouts(params?: AbandonedCheckoutQueryParams) {
  return useApiQuery<PaginatedAbandonedCheckoutsResponse>(
    endpoints.abandonedCheckouts.list,
    {
      params: params as Record<string, string | number | boolean | undefined>,
      enabled: true,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  );
}
