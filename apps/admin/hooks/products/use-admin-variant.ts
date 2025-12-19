"use client";

import { endpoints } from "@/lib/endpoints";
import type { Variant } from "@/lib/types/products";
import { useApiQuery } from "../use-api-query";

export function useAdminVariant(productId: string, variantId: string) {
  return useApiQuery<Variant>(
    endpoints.products.variants.detail(productId, variantId),
    {
      enabled: !!productId && !!variantId,
    },
  );
}
