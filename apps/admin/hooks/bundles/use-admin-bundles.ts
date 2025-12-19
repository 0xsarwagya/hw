"use client";

import { endpoints } from "@/lib/endpoints";
import type {
  BundleQueryParams,
  PaginatedBundlesResponse,
} from "@/lib/types/bundles";
import { useApiQuery } from "../use-api-query";

export function useAdminBundles(params?: BundleQueryParams) {
  return useApiQuery<PaginatedBundlesResponse>(endpoints.bundles.list, {
    params: params as Record<string, string | number | boolean | undefined>,
    enabled: true,
  });
}
