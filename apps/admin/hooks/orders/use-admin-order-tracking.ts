"use client";

import { endpoints } from "@/lib/endpoints";
import type { OrderTracking } from "@/lib/types/shipping";
import { useApiQuery } from "../use-api-query";

export function useAdminOrderTracking(orderId: string, enabled = true) {
  return useApiQuery<OrderTracking>(endpoints.orders.tracking(orderId), {
    enabled: enabled && !!orderId,
  });
}
