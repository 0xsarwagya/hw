"use client";

import { endpoints } from "@/lib/endpoints";
import type { ProductVariantOptionType } from "@/lib/types/products";
import { useApiQuery } from "../use-api-query";

export function useAdminProductVariantOptionTypes(productId: string) {
  return useApiQuery<ProductVariantOptionType[]>(
    endpoints.variantOptionTypes.product.list(productId),
    {
      enabled: !!productId,
    },
  );
}
