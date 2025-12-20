"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Skeleton loading component for inventory list table
 */
export function InventoryListSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">SKU</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="w-[150px]">Attributes</TableHead>
            <TableHead className="w-[100px]">Inventory</TableHead>
            <TableHead className="w-[100px]">Reserved</TableHead>
            <TableHead className="w-[100px]">Available</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[150px]">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from(
            { length: 10 },
            (_, i) => `inventory-row-skeleton-${i}`,
          ).map((key) => (
            <TableRow key={key}>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
