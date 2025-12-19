"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { Discount } from "@/lib/types/discounts";

export function useAdminDiscount(discountId: string, enabled = true) {
  return useApiQuery<Discount>(endpoints.discounts.detail(discountId), {
    enabled: enabled && !!discountId,
  });
}

