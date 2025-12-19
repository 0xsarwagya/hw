"use client";

import { endpoints } from "@/lib/endpoints";
import type {
  CollectionQueryParams,
  PaginatedCollectionsResponse,
} from "@/lib/types/collections";
import { useApiQuery } from "../use-api-query";

export function useAdminCollections(params?: CollectionQueryParams) {
  return useApiQuery<PaginatedCollectionsResponse>(endpoints.collections.list, {
    params: params as Record<string, string | number | boolean | undefined>,
    enabled: true,
  });
}
