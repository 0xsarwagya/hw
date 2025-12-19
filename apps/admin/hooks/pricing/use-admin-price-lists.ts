"use client";

import { endpoints } from "@/lib/endpoints";
import type { PriceList, PriceListQueryParams } from "@/lib/types/price-lists";
import { useApiQuery } from "../use-api-query";

export function useAdminPriceLists(params?: PriceListQueryParams) {
  return useApiQuery<PriceList[]>(endpoints.priceLists.list, {
    params: params as Record<string, string | number | boolean | undefined>,
    enabled: true,
  });
}

export function useAdminActivePriceLists() {
  return useApiQuery<PriceList[]>(endpoints.priceLists.active, {
    enabled: true,
  });
}
