"use client";

import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ActiveReservation } from "@/lib/types/inventory";

interface InventoryReservationsTableProps {
  reservations: ActiveReservation[];
}

/**
 * Table component for displaying real-time inventory reservations
 */
export function InventoryReservationsTable({
  reservations,
}: InventoryReservationsTableProps) {
  const getExpiresIn = (expiresAt: Date | string) => {
    if (!expiresAt) return "N/A";
    const now = new Date();
    const expires = new Date(expiresAt);
    if (Number.isNaN(expires.getTime())) return "Invalid date";
    if (expires < now) {
      return "Expired";
    }
    return formatDistanceToNow(expires, { addSuffix: true });
  };

  const isExpired = (expiresAt: Date | string) => {
    if (!expiresAt) return true;
    const expires = new Date(expiresAt);
    if (Number.isNaN(expires.getTime())) return true;
    return expires < new Date();
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Cart ID</TableHead>
            <TableHead className="w-[100px] text-right">Quantity</TableHead>
            <TableHead className="w-[150px]">Expires In</TableHead>
            <TableHead className="w-[180px]">Created At</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground py-8"
              >
                No active reservations
              </TableCell>
            </TableRow>
          ) : (
            reservations.map((reservation) => (
              <TableRow key={reservation.cartId}>
                <TableCell className="font-mono text-sm">
                  {reservation.cartId.slice(0, 8)}...
                </TableCell>
                <TableCell className="text-right font-medium">
                  {reservation.qty}
                </TableCell>
                <TableCell className="text-sm">
                  {getExpiresIn(reservation.expiresAt)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {reservation.expiresAt
                    ? formatDistanceToNow(new Date(reservation.expiresAt), {
                        addSuffix: true,
                      }).replace("in ", "")
                    : "-"}
                </TableCell>
                <TableCell>
                  {isExpired(reservation.expiresAt) ? (
                    <Badge variant="destructive">Expired</Badge>
                  ) : (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
