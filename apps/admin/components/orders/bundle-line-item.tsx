"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { OrderItem } from "@/lib/types/orders";
import { Money } from "./money";

interface BundleLineItemProps {
  item: OrderItem;
}

export function BundleLineItem({ item }: BundleLineItemProps) {
  if (!item.bundleId || !item.bundleVariantBreakdown) {
    return null;
  }

  return (
    <Card className="mt-2 border-l-2 border-l-primary">
      <CardContent className="pt-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {item.bundleTitle || "Bundle"}
            </span>
            <Money amount={item.price * item.quantity} />
          </div>
          <div className="ml-4 space-y-1">
            {item.bundleVariantBreakdown.map((variant, idx) => (
              <div
                key={`bundle-variant-${String(idx)}`}
                className="flex items-center justify-between text-sm text-muted-foreground"
              >
                <span>
                  {variant.quantity}x Variant {idx + 1}
                </span>
                <Money amount={variant.unitPrice * variant.quantity} />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
