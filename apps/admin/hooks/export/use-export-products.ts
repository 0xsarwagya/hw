"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { exportToCSV } from "@/lib/export/csv";

interface ProductExportData extends Record<string, unknown> {
  id: string;
  title: string;
  sku: string;
  price: string;
  compareAtPrice?: string;
  status: string;
  inventoryQuantity: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook to export products to CSV
 */
export function useExportProducts() {
  return useMutation({
    mutationFn: async () => {
      const response = await apiFetch<ProductExportData[]>(
        "/admin/products/export",
      );

      const filename = `products-export-${new Date().toISOString().split("T")[0]}.csv`;
      exportToCSV(response, filename, [
        "id",
        "title",
        "sku",
        "price",
        "compareAtPrice",
        "status",
        "inventoryQuantity",
        "createdAt",
        "updatedAt",
      ]);
    },
  });
}
