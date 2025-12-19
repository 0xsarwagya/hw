"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { PaginatedCollectionsResponse, CollectionQueryParams } from "@/lib/types/collections";

export function useAdminCollections(params?: CollectionQueryParams) {
  return useApiQuery<PaginatedCollectionsResponse>(endpoints.collections.list, {
    params: params as Record<string, string | number | boolean | undefined>,
    enabled: true,
  });
}

