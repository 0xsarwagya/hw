"use client";

import { endpoints } from "@/lib/endpoints";
import type { CollectionProduct } from "@/lib/types/collections";
import { useApiQuery } from "../use-api-query";

export function useAdminCollectionProducts(collectionId: string) {
  return useApiQuery<CollectionProduct[]>(
    endpoints.collections.products.list(collectionId),
    {
      enabled: !!collectionId,
    },
  );
}
