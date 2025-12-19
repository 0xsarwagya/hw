"use client";

import { useRouter } from "next/navigation";
import { DateTime } from "@/components/orders/date-time";
import { Money } from "@/components/orders/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AbandonedCheckout } from "@/lib/types/abandoned-checkouts";

interface AbandonedCheckoutsTableProps {
  checkouts: AbandonedCheckout[];
  isLoading?: boolean;
  onConvert?: (checkout: AbandonedCheckout) => void;
}

export function AbandonedCheckoutsTable({
  checkouts,
  isLoading,
  onConvert,
}: AbandonedCheckoutsTableProps) {
  const router = useRouter();

  if (isLoading) {
    return null; // Skeleton handled by parent
  }

  if (checkouts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-lg font-medium mb-2">No abandoned checkouts found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cart ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {checkouts.map((checkout) => (
            <TableRow
              key={checkout.id}
              className="cursor-pointer"
              onClick={() =>
                router.push(`/orders/abandoned/${checkout.cartId}`)
              }
            >
              <TableCell className="font-mono text-sm">
                {checkout.cartId.slice(0, 8)}...
              </TableCell>
              <TableCell>
                {checkout.customerId ? "Customer" : "Guest"}
              </TableCell>
              <TableCell>
                {checkout.customerEmail || (
                  <span className="text-muted-foreground">No email</span>
                )}
              </TableCell>
              <TableCell>
                <Money amount={checkout.total} />
              </TableCell>
              <TableCell>{checkout.items.length}</TableCell>
              <TableCell>
                <Badge variant="outline">{checkout.checkoutState}</Badge>
              </TableCell>
              <TableCell>
                <DateTime date={checkout.createdAt} />
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                {checkout.paymentIntentId && onConvert && (
                  <Button
                    size="sm"
                    onClick={() => onConvert(checkout)}
                    variant="outline"
                  >
                    Convert to Order
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
