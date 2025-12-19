"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { InventoryMetrics } from "@/lib/types/inventory";

export function useAdminInventoryMetrics() {
  return useApiQuery<InventoryMetrics>(endpoints.inventory.metrics, {
    enabled: true,
  });
}

