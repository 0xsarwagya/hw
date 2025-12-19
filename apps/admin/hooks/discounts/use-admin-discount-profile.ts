"use client";

import { endpoints } from "@/lib/endpoints";
import type { ProfilerMetrics } from "@/lib/types/discounts";
import { useApiQuery } from "../use-api-query";

export function useAdminDiscountProfile() {
  return useApiQuery<ProfilerMetrics>(endpoints.discounts.profile, {
    enabled: true,
  });
}
