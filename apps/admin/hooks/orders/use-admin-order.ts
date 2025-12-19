"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { Order } from "@/lib/types/orders";

export function useAdminOrder(orderId: string, enabled = true) {
  // Use API route proxy for cookie handling
  return useApiQuery<Order>(endpoints.orders.detail(orderId), {
    enabled: enabled && !!orderId,
  });
}

