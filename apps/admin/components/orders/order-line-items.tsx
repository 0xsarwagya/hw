"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "./money";
import { BundleLineItem } from "./bundle-line-item";
import type { Order } from "@/lib/types/orders";

interface OrderLineItemsProps {
  order: Order;
}

export function OrderLineItems({ order }: OrderLineItemsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between border-b pb-4 last:border-0">
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.productTitle || "Product"}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                  )}
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
                    {item.bundleId && (
                      <BundleLineItem item={item} />
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Money amount={item.price * item.quantity} />
                <p className="text-sm text-muted-foreground">
                  <Money amount={item.price} showCurrency={false} /> each
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

