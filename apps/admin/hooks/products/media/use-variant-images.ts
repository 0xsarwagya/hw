"use client";

import { endpoints } from "@/lib/endpoints";
import type { ProductImage } from "@/lib/types/products";
import { useApiQuery } from "../../use-api-query";

export function useVariantImages(productId: string, variantId: string) {
  return useApiQuery<ProductImage[]>(
    endpoints.products.variantImages.list(productId, variantId),
    {
      enabled: !!productId && !!variantId,
    },
  );
}
