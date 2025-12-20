"use client";

import { Badge } from "@/components/ui/badge";

export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

interface InventoryStatusBadgeProps {
  status: InventoryStatus;
  available?: number;
}

/**
 * Badge component for displaying inventory status
 */
export function InventoryStatusBadge({
  status,
  available,
}: InventoryStatusBadgeProps) {
  switch (status) {
    case "out_of_stock":
      return (
        <Badge variant="destructive" className="font-medium">
          Out of Stock
        </Badge>
      );
    case "low_stock":
      return (
        <Badge
          variant="outline"
          className="font-medium border-yellow-500 text-yellow-700 bg-yellow-50"
        >
          Low Stock {available !== undefined && `(${available})`}
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="font-medium">
          In Stock {available !== undefined && `(${available})`}
        </Badge>
      );
  }
}
