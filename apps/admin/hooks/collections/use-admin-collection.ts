"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { Collection } from "@/lib/types/collections";

export function useAdminCollection(collectionId: string) {
  return useApiQuery<Collection>(endpoints.collections.detail(collectionId), {
    enabled: !!collectionId,
  });
}

