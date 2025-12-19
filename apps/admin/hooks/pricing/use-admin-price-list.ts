"use client";

import { endpoints } from "@/lib/endpoints";
import type { PriceList } from "@/lib/types/price-lists";
import { useApiQuery } from "../use-api-query";

export function useAdminPriceList(priceListId: string, enabled = true) {
  return useApiQuery<PriceList>(endpoints.priceLists.detail(priceListId), {
    enabled: enabled && !!priceListId,
  });
}
