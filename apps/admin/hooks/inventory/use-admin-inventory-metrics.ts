"use client";

import { endpoints } from "@/lib/endpoints";
import type { InventoryMetrics } from "@/lib/types/inventory";
import { useApiQuery } from "../use-api-query";

export function useAdminInventoryMetrics() {
  return useApiQuery<InventoryMetrics>(endpoints.inventory.metrics, {
    enabled: true,
  });
}
