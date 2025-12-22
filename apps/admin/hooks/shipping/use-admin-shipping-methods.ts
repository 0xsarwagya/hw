"use client";

import { endpoints } from "@/lib/endpoints";
import type { ShippingMethod } from "@/lib/types/shipping-methods";
import { useApiQuery } from "../use-api-query";

export function useAdminShippingMethods(includeInactive = false) {
  return useApiQuery<ShippingMethod[]>(endpoints.shippingMethods.list, {
    params: includeInactive ? { includeInactive: "true" } : undefined,
    enabled: true,
  });
}
