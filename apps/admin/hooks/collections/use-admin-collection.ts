"use client";

import { endpoints } from "@/lib/endpoints";
import type { Collection } from "@/lib/types/collections";
import { useApiQuery } from "../use-api-query";

export function useAdminCollection(collectionId: string) {
  return useApiQuery<Collection>(endpoints.collections.detail(collectionId), {
    enabled: !!collectionId,
  });
}
