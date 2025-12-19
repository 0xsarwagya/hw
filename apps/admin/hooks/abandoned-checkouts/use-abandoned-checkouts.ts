"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type {
  PaginatedAbandonedCheckoutsResponse,
  AbandonedCheckoutQueryParams,
} from "@/lib/types/abandoned-checkouts";

export function useAbandonedCheckouts(params?: AbandonedCheckoutQueryParams) {
  return useApiQuery<PaginatedAbandonedCheckoutsResponse>(
    endpoints.abandonedCheckouts.list,
    {
      params: params as Record<string, string | number | boolean | undefined>,
      enabled: true,
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );
}

