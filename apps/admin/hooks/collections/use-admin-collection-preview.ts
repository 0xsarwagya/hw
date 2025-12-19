"use client";

import { endpoints } from "@/lib/endpoints";
import type { CollectionPreviewResponse } from "@/lib/types/collections";
import { useApiQuery } from "../use-api-query";

/**
 * Hook for previewing automatic collection results
 * Returns the count of products that would match the collection's rules
 */
export function useAdminCollectionPreview(
  collectionId: string,
  enabled: boolean = true,
) {
  return useApiQuery<CollectionPreviewResponse>(
    endpoints.collections.preview(collectionId),
    {
      enabled: enabled && !!collectionId,
    },
  );
}
