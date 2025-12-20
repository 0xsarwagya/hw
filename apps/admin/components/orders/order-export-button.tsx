"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useExportOrders } from "@/hooks/export/use-export-orders";

interface OrderExportButtonProps {
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  };
}

/**
 * Button to export orders to CSV
 */
export function OrderExportButton({ filters }: OrderExportButtonProps) {
  const exportOrders = useExportOrders();

  const handleExport = async () => {
    try {
      await exportOrders.mutateAsync(filters);
      toast.success("Orders exported successfully");
    } catch (_error) {
      toast.error("Failed to export orders");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={exportOrders.isPending}
    >
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
}
