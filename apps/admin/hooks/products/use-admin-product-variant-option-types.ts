"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { ProductVariantOptionType } from "@/lib/types/products";

export function useAdminProductVariantOptionTypes(productId: string) {
  return useApiQuery<ProductVariantOptionType[]>(
    endpoints.variantOptionTypes.product.list(productId),
    {
      enabled: !!productId,
    },
  );
}

