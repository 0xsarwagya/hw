"use client";

import { endpoints } from "@/lib/endpoints";
import type { OrderTimeline } from "@/lib/types/orders";
import { useApiQuery } from "../use-api-query";

export function useAdminOrderTimeline(orderId: string, enabled = true) {
  return useApiQuery<OrderTimeline>(endpoints.orders.timeline(orderId), {
    enabled: enabled && !!orderId,
  });
}
