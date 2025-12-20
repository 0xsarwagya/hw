"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Order } from "@/lib/types/orders";
import { DateTime } from "./date-time";
import { FulfillmentStatusBadge } from "./fulfillment-status-badge";
import { Money } from "./money";
import { OrderStatusBadge } from "./order-status-badge";
import { PaymentStatusBadge } from "./payment-status-badge";

interface OrderHeaderProps {
  order: Order;
}

export function OrderHeader({ order }: OrderHeaderProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{order.orderNumber}</h2>
              <p className="text-sm text-muted-foreground">
                Order ID: {order.id}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                <DateTime date={order.createdAt} format="full" />
              </p>
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
                <p className="text-sm text-muted-foreground">
                  {order.customerEmail}
                </p>
              )}
            </div>
            {order.abandonedCheckoutId && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  <Link
                    href={`/orders/abandoned/${order.abandonedCheckoutId}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View Abandoned Checkout
                  </Link>
                </div>
                {order.recoverySource && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Recovered via {order.recoverySource}
                    {order.recoveredAt && (
                      <> · <DateTime date={order.recoveredAt} format="short" /></>
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Order Total</p>
              <p className="text-2xl font-bold">
                <Money amount={order.total} />
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

