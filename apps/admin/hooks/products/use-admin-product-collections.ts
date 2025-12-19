"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { Collection } from "@/lib/types/collections";

export function useAdminProductCollections(productId: string) {
  return useApiQuery<Collection[]>(endpoints.products.collections(productId), {
    enabled: !!productId,
  });
}

