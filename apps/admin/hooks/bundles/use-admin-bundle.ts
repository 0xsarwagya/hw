"use client";

import { endpoints } from "@/lib/endpoints";
import type { Bundle } from "@/lib/types/bundles";
import { useApiQuery } from "../use-api-query";

export function useAdminBundle(bundleId: string, enabled = true) {
  return useApiQuery<Bundle>(endpoints.bundles.detail(bundleId), {
    enabled: enabled && !!bundleId,
  });
}
