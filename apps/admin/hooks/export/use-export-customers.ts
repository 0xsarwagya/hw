"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { exportToCSV } from "@/lib/export/csv";

interface CustomerExportData extends Record<string, unknown> {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  totalOrders: number;
  totalSpent: string;
  createdAt: string;
  lastOrderDate?: string;
}

/**
 * Hook to export customers to CSV
 */
export function useExportCustomers() {
  return useMutation({
    mutationFn: async () => {
      const response = await apiFetch<CustomerExportData[]>(
        "/admin/customers/export",
      );

      const filename = `customers-export-${new Date().toISOString().split("T")[0]}.csv`;
      exportToCSV(response, filename, [
        "id",
        "email",
        "firstName",
        "lastName",
        "phone",
        "totalOrders",
        "totalSpent",
        "createdAt",
        "lastOrderDate",
      ]);
    },
  });
}
