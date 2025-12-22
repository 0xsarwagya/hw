"use client";

import { endpoints } from "@/lib/endpoints";
import type { ShippingMethod } from "@/lib/types/shipping-methods";
import { useApiQuery } from "../use-api-query";

export function useAdminShippingMethod(id: string) {
  return useApiQuery<ShippingMethod>(endpoints.shippingMethods.detail(id), {
    enabled: !!id,
  });
}
