"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { OrderTracking } from "@/lib/types/shipping";

export function useAdminOrderTracking(orderId: string, enabled = true) {
  return useApiQuery<OrderTracking>(endpoints.orders.tracking(orderId), {
    enabled: enabled && !!orderId,
  });
}

