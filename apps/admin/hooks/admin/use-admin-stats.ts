"use client";

import { endpoints } from "@/lib/endpoints";
import type { AdminStats } from "@/lib/types/admin";
import { useApiQuery } from "../use-api-query";

export function useAdminStats() {
  return useApiQuery<AdminStats>(endpoints.admin.stats, {
    enabled: true,
  });
}
