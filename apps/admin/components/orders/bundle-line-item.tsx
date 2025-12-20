"use client";

import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Card className="mt-2 border-l-2 border-l-primary bg-muted/30">
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {item.bundleTitle || "Bundle"}
              </span>
              <Badge variant="secondary" className="text-xs">
                Bundle
              </Badge>
            </div>
            <Money amount={item.price * item.quantity} />
          </div>
          <div className="ml-6 space-y-2 border-l-2 border-l-border pl-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Bundle Items
            </p>
            {item.bundleVariantBreakdown.map((variant, idx) => (
              <div
                key={`bundle-variant-${variant.variantId}-${idx}`}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex-1">
                  <span className="text-muted-foreground">
                    {variant.quantity}x Item {idx + 1}
                  </span>
                  {item.variantTitle && idx === 0 && (
                    <p className="text-xs text-muted-foreground">
                      {item.variantTitle}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <Money amount={variant.unitPrice * variant.quantity} />
                  <p className="text-xs text-muted-foreground">
                    <Money amount={variant.unitPrice} showCurrency={false} /> each
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
