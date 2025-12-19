"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { PriceList } from "@/lib/types/price-lists";

export function useAdminPriceList(priceListId: string, enabled = true) {
  return useApiQuery<PriceList>(endpoints.priceLists.detail(priceListId), {
    enabled: enabled && !!priceListId,
  });
}

