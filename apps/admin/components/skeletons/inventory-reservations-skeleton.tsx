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
 * Skeleton loading component for inventory reservations table
 */
export function InventoryReservationsSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Cart ID</TableHead>
            <TableHead className="w-[100px]">Quantity</TableHead>
            <TableHead className="w-[150px]">Expires In</TableHead>
            <TableHead className="w-[180px]">Created At</TableHead>
            <TableHead className="w-[120px]">Session Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from(
            { length: 5 },
            (_, i) => `reservation-skeleton-${i.toString()}`,
          ).map((key) => (
            <TableRow key={key}>
              <TableCell>
                <Skeleton className="h-4 w-36" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-12" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-24" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
