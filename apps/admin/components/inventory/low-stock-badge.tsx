"use client";

import { Badge } from "@/components/ui/badge";
import type { InventoryListItem } from "@/lib/types/inventory";

interface LowStockBadgeProps {
  item: InventoryListItem;
  threshold?: number;
}

/**
 * Badge component for displaying low stock status
 * Color-coded: yellow for low stock, red for out of stock
 */
export function LowStockBadge({
  item,
  threshold: _threshold,
}: LowStockBadgeProps) {
  if (item.inventory === 0) {
    return (
      <Badge variant="destructive" className="font-medium">
        Out of Stock
      </Badge>
    );
  }

  if (item.lowStock) {
    return (
      <Badge
        variant="outline"
        className="font-medium border-yellow-500 text-yellow-700 bg-yellow-50"
      >
        Low Stock
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="font-medium">
      In Stock
    </Badge>
  );
}
