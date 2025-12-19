"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { ListFilesResponse, ListFilesParams } from "@/lib/types/storage";

export function useAdminStorageList(params?: ListFilesParams) {
  return useApiQuery<ListFilesResponse>(endpoints.storage.list, {
    params: params as Record<string, string | number | boolean | undefined>,
    enabled: true,
  });
}

