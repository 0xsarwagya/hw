"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { exportToCSV } from "@/lib/export/csv";

interface OrderExportData extends Record<string, unknown> {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  status: string;
  total: string;
  createdAt: string;
  paymentMethod: string;
  shippingAddress: string;
}

/**
 * Hook to export orders to CSV
 */
export function useExportOrders() {
  return useMutation({
    mutationFn: async (filters?: {
      status?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);

      const response = await apiFetch<OrderExportData[]>(
        `/admin/orders/export?${params.toString()}`,
      );

      const filename = `orders-export-${new Date().toISOString().split("T")[0]}.csv`;
      exportToCSV(response, filename, [
        "id",
        "orderNumber",
        "customerEmail",
        "customerName",
        "status",
        "total",
        "createdAt",
        "paymentMethod",
        "shippingAddress",
      ]);
    },
  });
}
