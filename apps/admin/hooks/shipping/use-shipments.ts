"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { Shipment } from "@/lib/types/shipping";

export function useShipments(orderId?: string) {
  const params = orderId ? { orderId } : undefined;
  // Use API route proxy for cookie handling
  return useApiQuery<Shipment[]>("/api/shipping/shipments", {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

