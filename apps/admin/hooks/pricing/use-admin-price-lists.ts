"use client";

import { endpoints } from "@/lib/endpoints";
import type { PriceList } from "@/lib/types/price-lists";
import { useApiQuery } from "../use-api-query";

export function useAdminPriceLists() {
  return useApiQuery<PriceList[]>(endpoints.priceLists.list, {
    enabled: true,
  });
}

export function useAdminActivePriceLists() {
  return useApiQuery<PriceList[]>(endpoints.priceLists.active, {
    enabled: true,
  });
}
