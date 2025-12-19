"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { PaginatedBundlesResponse, BundleQueryParams } from "@/lib/types/bundles";

export function useAdminBundles(params?: BundleQueryParams) {
  return useApiQuery<PaginatedBundlesResponse>(endpoints.bundles.list, {
    params: params as Record<string, string | number | boolean | undefined>,
    enabled: true,
  });
}

