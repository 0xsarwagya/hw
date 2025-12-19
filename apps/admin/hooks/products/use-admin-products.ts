"use client";

import { endpoints } from "@/lib/endpoints";
import type {
  PaginatedProductsResponse,
  ProductQueryParams,
} from "@/lib/types/products";
import { useApiQuery } from "../use-api-query";

export function useAdminProducts(params?: ProductQueryParams) {
  return useApiQuery<PaginatedProductsResponse>(endpoints.products.list, {
    params: params as Record<string, string | number | boolean | undefined>,
    enabled: true,
  });
}
