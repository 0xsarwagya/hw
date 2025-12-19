"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Order } from "@/lib/types/orders";
import { DateTime } from "./date-time";
import { Money } from "./money";
import { OrderStatusBadge } from "./order-status-badge";

interface OrdersTableProps {
  orders: Order[];
  isLoading?: boolean;
}

export function OrdersTable({ orders, isLoading }: OrdersTableProps) {
  const router = useRouter();

  if (isLoading) {
    return null; // Skeleton handled by parent
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-lg font-medium mb-2">No orders found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Fulfillment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              className="cursor-pointer"
              onClick={() => router.push(`/orders/${order.id}`)}
            >
              <TableCell className="font-medium">{order.orderNumber}</TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell>
                {order.customerName || order.customerEmail || "Guest Checkout"}
              </TableCell>
              <TableCell>
                <Money amount={order.total} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {order.paymentMethod || "N/A"}
              </TableCell>
              <TableCell>
                <DateTime date={order.createdAt} />
              </TableCell>
              <TableCell>
                {order.fulfillmentStatus ? (
                  <span className="text-sm capitalize">
                    {order.fulfillmentStatus.replace("_", " ")}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">N/A</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
