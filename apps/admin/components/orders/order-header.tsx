"use client";

import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "./order-status-badge";
import { PaymentStatusBadge } from "./payment-status-badge";
import { FulfillmentStatusBadge } from "./fulfillment-status-badge";
import type { Order } from "@/lib/types/orders";
import Link from "next/link";

interface OrderHeaderProps {
  order: Order;
}

export function OrderHeader({ order }: OrderHeaderProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{order.orderNumber}</h2>
              <p className="text-sm text-muted-foreground">Order ID: {order.id}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <OrderStatusBadge status={order.status} />
              {order.paymentStatus && (
                <PaymentStatusBadge status={order.paymentStatus} />
              )}
              {order.fulfillmentStatus && (
                <FulfillmentStatusBadge status={order.fulfillmentStatus} />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              {order.customerId ? (
                <Link
                  href={`/customers/${order.customerId}`}
                  className="font-medium hover:underline"
                >
                  {order.customerName || order.customerEmail || "Unknown"}
                </Link>
              ) : (
                <p className="font-medium">Guest Checkout</p>
              )}
              {order.customerEmail && (
                <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

