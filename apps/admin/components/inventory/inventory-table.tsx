"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InventoryListItem } from "@/lib/types/inventory";
import { LowStockBadge } from "./low-stock-badge";

interface InventoryTableProps {
  items: InventoryListItem[];
}

/**
 * Table component for displaying inventory list
 * Clickable rows navigate to detail page
 */
export function InventoryTable({ items }: InventoryTableProps) {
  const formatAttributes = (attributes?: Record<string, string>) => {
    if (!attributes || Object.keys(attributes).length === 0) {
      return "-";
    }
    return Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">SKU</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="w-[150px]">Attributes</TableHead>
            <TableHead className="w-[100px] text-right">Inventory</TableHead>
            <TableHead className="w-[100px] text-right">Reserved</TableHead>
            <TableHead className="w-[100px] text-right">Available</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[150px]">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center text-muted-foreground py-8"
              >
                No inventory items found
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow
                key={item.variantId}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => {
                  window.location.href = `/inventory/${item.variantId}`;
                }}
              >
                <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatAttributes(item.attributes)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {item.inventory}
                </TableCell>
                <TableCell className="text-right text-orange-600">
                  {item.committed}
                </TableCell>
                <TableCell className="text-right text-green-600 font-medium">
                  {item.available}
                </TableCell>
                <TableCell>
                  <LowStockBadge item={item} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.updatedAt
                    ? formatDistanceToNow(new Date(item.updatedAt), {
                        addSuffix: true,
                      })
                    : "-"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
