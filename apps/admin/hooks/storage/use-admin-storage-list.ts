"use client";

import { endpoints } from "@/lib/endpoints";
import type { ListFilesParams, ListFilesResponse } from "@/lib/types/storage";
import { useApiQuery } from "../use-api-query";

export function useAdminStorageList(params?: ListFilesParams) {
  return useApiQuery<ListFilesResponse>(endpoints.storage.list, {
    params: params as Record<string, string | number | boolean | undefined>,
    enabled: true,
  });
}
