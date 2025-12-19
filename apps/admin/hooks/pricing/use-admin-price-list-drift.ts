"use client";

import { endpoints } from "@/lib/endpoints";
import type {
  PaginatedPricingDriftReportResponse,
  PricingDriftReportQuery,
} from "@/lib/types/price-lists";
import { useApiQuery } from "../use-api-query";

export function useAdminPriceListDrift(params?: PricingDriftReportQuery) {
  return useApiQuery<PaginatedPricingDriftReportResponse>(
    endpoints.priceLists.driftReport,
    {
      params: params as Record<string, string | number | boolean | undefined>,
      enabled: true,
    },
  );
}
