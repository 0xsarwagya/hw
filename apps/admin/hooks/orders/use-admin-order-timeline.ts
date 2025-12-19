"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { OrderTimeline } from "@/lib/types/orders";

export function useAdminOrderTimeline(orderId: string, enabled = true) {
  return useApiQuery<OrderTimeline>(endpoints.orders.timeline(orderId), {
    enabled: enabled && !!orderId,
  });
}

