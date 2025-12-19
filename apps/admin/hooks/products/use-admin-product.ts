"use client";

import { endpoints } from "@/lib/endpoints";
import type { ProductWithVariants } from "@/lib/types/products";
import { useApiQuery } from "../use-api-query";

export function useAdminProduct(productId: string) {
  return useApiQuery<ProductWithVariants>(
    endpoints.products.detail(productId),
    {
      enabled: !!productId,
    },
  );
}
