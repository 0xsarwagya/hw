"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order } from "@/lib/types/orders";
import { Money } from "./money";

interface OrderSummaryProps {
  order: Order;
}

export function OrderSummary({ order }: OrderSummaryProps) {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <Money amount={order.subtotal} />
          </div>
          {order.gstAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST</span>
              <Money amount={order.gstAmount} />
            </div>
          )}
          {order.shippingCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <Money amount={order.shippingCost} />
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <Money amount={order.total} />
          </div>
        </div>
        {order.gstBreakdown && (
          <div className="pt-4 border-t space-y-1 text-xs text-muted-foreground">
            <p>GST Breakdown:</p>
            {order.gstBreakdown.cgst > 0 && (
              <p>
                CGST: <Money amount={order.gstBreakdown.cgst} />
              </p>
            )}
            {order.gstBreakdown.sgst > 0 && (
              <p>
                SGST: <Money amount={order.gstBreakdown.sgst} />
              </p>
            )}
            {order.gstBreakdown.igst > 0 && (
              <p>
                IGST: <Money amount={order.gstBreakdown.igst} />
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
