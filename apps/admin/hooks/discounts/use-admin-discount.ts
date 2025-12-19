"use client";

import { endpoints } from "@/lib/endpoints";
import type { Discount } from "@/lib/types/discounts";
import { useApiQuery } from "../use-api-query";

export function useAdminDiscount(discountId: string, enabled = true) {
  return useApiQuery<Discount>(endpoints.discounts.detail(discountId), {
    enabled: enabled && !!discountId,
  });
}
