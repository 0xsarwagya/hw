"use client";

import { endpoints } from "@/lib/endpoints";
import type { ActivityLog } from "@/lib/types/activity-logs";
import { useApiQuery } from "../use-api-query";

export function useAdminActivityLog(id: string) {
  return useApiQuery<ActivityLog>(endpoints.activityLogs.detail(id), {
    enabled: !!id,
  });
}
