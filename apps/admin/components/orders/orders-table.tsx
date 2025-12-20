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
import { FulfillmentStatusBadge } from "./fulfillment-status-badge";
import { Money } from "./money";
import { OrderStatusBadge } from "./order-status-badge";
import { PaymentStatusBadge } from "./payment-status-badge";

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
            <TableHead>Payment Status</TableHead>
            <TableHead>Fulfillment</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/orders/${order.id}`)}
            >
              <TableCell className="font-medium">
                <button
                  className="hover:underline text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/orders/${order.id}`);
                  }}
                >
                  {order.orderNumber}
                </button>
              </TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>
                    {order.customerName || order.customerEmail || "Guest Checkout"}
                  </span>
                  {order.customerEmail && order.customerName && (
                    <span className="text-xs text-muted-foreground">
                      {order.customerEmail}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Money amount={order.total} />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {order.paymentMethod || "N/A"}
                  </span>
                  {order.paymentMethod === "COD" && (
                    <span className="text-xs text-muted-foreground">Cash on Delivery</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {order.paymentStatus ? (
                  <PaymentStatusBadge status={order.paymentStatus} />
                ) : (
                  <span className="text-sm text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell>
                {order.fulfillmentStatus ? (
                  <FulfillmentStatusBadge status={order.fulfillmentStatus} />
                ) : (
                  <span className="text-sm text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell>
                <DateTime date={order.createdAt} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
