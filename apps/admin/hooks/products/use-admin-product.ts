"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { ProductWithVariants } from "@/lib/types/products";

export function useAdminProduct(productId: string) {
  return useApiQuery<ProductWithVariants>(endpoints.products.detail(productId), {
    enabled: !!productId,
  });
}

