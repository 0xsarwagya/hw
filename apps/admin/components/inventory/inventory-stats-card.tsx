"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InventoryItem } from "@/lib/types/inventory";

interface InventoryStatsCardProps {
  item: InventoryItem;
}

/**
 * Card component displaying inventory statistics for a variant
 */
export function InventoryStatsCard({ item }: InventoryStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Inventory</p>
            <p className="text-2xl font-bold">{item.inventory}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Committed</p>
            <p className="text-2xl font-bold text-orange-600">
              {item.committed}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-2xl font-bold text-green-600">
              {item.available}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Low Stock Threshold</p>
            <p className="text-sm font-medium">{item.lowStockThreshold}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
