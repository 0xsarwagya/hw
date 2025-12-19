"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { AdminStats } from "@/lib/types/admin";

export function useAdminStats() {
  return useApiQuery<AdminStats>(endpoints.admin.stats, {
    enabled: true,
  });
}

