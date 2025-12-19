"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/orders/money";
import { DateTime } from "@/components/orders/date-time";
import { ConvertToOrderDialog } from "./convert-to-order-dialog";
import type { AbandonedCheckout } from "@/lib/types/abandoned-checkouts";

interface AbandonedCheckoutDetailProps {
  checkout: AbandonedCheckout;
}

export function AbandonedCheckoutDetail({ checkout }: AbandonedCheckoutDetailProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Checkout Details</CardTitle>
            <Badge variant="outline">{checkout.checkoutState}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Cart ID</p>
              <p className="font-mono text-sm">{checkout.cartId}</p>
            </div>
            {checkout.sessionId && (
              <div>
                <p className="text-sm text-muted-foreground">Session ID</p>
                <p className="font-mono text-sm">{checkout.sessionId}</p>
              </div>
            )}
            {checkout.customerEmail && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p>{checkout.customerEmail}</p>
              </div>
            )}
            {checkout.paymentIntentId && (
              <div>
                <p className="text-sm text-muted-foreground">Payment Intent ID</p>
                <p className="font-mono text-sm">{checkout.paymentIntentId}</p>
              </div>
            )}
          </div>
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total</span>
              <Money amount={checkout.total} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {checkout.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between border-b pb-4 last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium">
                    {item.productTitle || "Product"}
                  </p>
                  {item.variantTitle && (
                    <p className="text-sm text-muted-foreground">
                      {item.variantTitle}
                    </p>
                  )}
                  {item.bundleTitle && (
                    <p className="text-sm text-muted-foreground">
                      Bundle: {item.bundleTitle}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <Money amount={item.price * item.quantity} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {checkout.paymentIntentId && (
        <div className="flex justify-end">
          <ConvertToOrderDialog paymentIntentId={checkout.paymentIntentId} />
        </div>
      )}
    </div>
  );
}

