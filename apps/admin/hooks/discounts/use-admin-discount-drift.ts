"use client";

import { endpoints } from "@/lib/endpoints";
import type {
  DriftReportQuery,
  PaginatedDriftReportResponse,
} from "@/lib/types/discounts";
import { useApiQuery } from "../use-api-query";

export function useAdminDiscountDrift(params?: DriftReportQuery) {
  return useApiQuery<PaginatedDriftReportResponse>(
    endpoints.discounts.driftReport,
    {
      params: params as Record<string, string | number | boolean | undefined>,
      enabled: true,
    },
  );
}
