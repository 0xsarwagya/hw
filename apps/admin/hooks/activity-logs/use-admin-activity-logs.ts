"use client";

import { endpoints } from "@/lib/endpoints";
import type {
  ActivityLogQueryParams,
  PaginatedActivityLogsResponse,
} from "@/lib/types/activity-logs";
import { useApiQuery } from "../use-api-query";

export function useAdminActivityLogs(params?: ActivityLogQueryParams) {
  return useApiQuery<PaginatedActivityLogsResponse>(
    endpoints.activityLogs.list,
    {
      params: params as Record<string, string | number | boolean | undefined>,
      enabled: true,
    },
  );
}
