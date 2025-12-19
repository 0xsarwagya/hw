"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { Bundle } from "@/lib/types/bundles";

export function useAdminBundle(bundleId: string, enabled = true) {
  return useApiQuery<Bundle>(endpoints.bundles.detail(bundleId), {
    enabled: enabled && !!bundleId,
  });
}

