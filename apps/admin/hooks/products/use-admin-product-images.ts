"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { ProductImage } from "@/lib/types/products";

export function useAdminProductImages(productId: string) {
  return useApiQuery<ProductImage[]>(endpoints.products.images.list(productId), {
    enabled: !!productId,
  });
}

