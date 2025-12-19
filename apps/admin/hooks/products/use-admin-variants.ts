"use client";

import { endpoints } from "@/lib/endpoints";
import type { Variant } from "@/lib/types/products";
import { useApiQuery } from "../use-api-query";

export function useAdminVariants(productId: string) {
  return useApiQuery<Variant[]>(endpoints.products.variants.list(productId), {
    enabled: !!productId,
  });
}
