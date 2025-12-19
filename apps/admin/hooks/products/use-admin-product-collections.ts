"use client";

import { endpoints } from "@/lib/endpoints";
import type { Collection } from "@/lib/types/collections";
import { useApiQuery } from "../use-api-query";

export function useAdminProductCollections(productId: string) {
  return useApiQuery<Collection[]>(endpoints.products.collections(productId), {
    enabled: !!productId,
  });
}
