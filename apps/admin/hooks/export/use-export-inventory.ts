"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { exportToCSV } from "@/lib/export/csv";

interface InventoryExportData extends Record<string, unknown> {
  variantId: string;
  sku: string;
  productTitle: string;
  variantTitle: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  location?: string;
  cost?: string;
}

/**
 * Hook to export inventory to CSV
 */
export function useExportInventory() {
  return useMutation({
    mutationFn: async () => {
      const response = await apiFetch<InventoryExportData[]>(
        "/admin/inventory/export",
      );

      const filename = `inventory-export-${new Date().toISOString().split("T")[0]}.csv`;
      exportToCSV(response, filename, [
        "variantId",
        "sku",
        "productTitle",
        "variantTitle",
        "quantity",
        "reservedQuantity",
        "availableQuantity",
        "location",
        "cost",
      ]);
    },
  });
}
