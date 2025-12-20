"use client";

import { AlertTriangle, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order } from "@/lib/types/orders";
import { Money } from "./money";

interface OrderDiscountSectionProps {
  order: Order;
}

export function OrderDiscountSection({ order }: OrderDiscountSectionProps) {
  const hasDiscount = order.discountAmount > 0 || order.discountCode;
  const discountSnapshot = order.discountSnapshot as
    | {
        appliedDiscounts?: Array<{
          id?: string;
          code?: string;
          type?: string;
          value?: number;
          valueType?: string;
          name?: string;
        }>;
        autoDiscounts?: Array<{
          id?: string;
          code?: string;
          type?: string;
          value?: number;
          valueType?: string;
          name?: string;
        }>;
        bundleBreakdowns?: Array<unknown>;
        driftDetected?: boolean;
      }
    | null
    | undefined;

  if (!hasDiscount && !discountSnapshot) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Discounts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {order.discountCode && (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Discount Code</p>
              <p className="text-sm text-muted-foreground">
                {order.discountCode}
              </p>
            </div>
            <Badge variant="secondary">{order.discountCode}</Badge>
          </div>
        )}

        {order.discountAmount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Discount Amount
            </span>
            <Money amount={order.discountAmount} />
          </div>
        )}

        {discountSnapshot && (
          <>
            {discountSnapshot.appliedDiscounts &&
              discountSnapshot.appliedDiscounts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Applied Discounts</p>
                  {discountSnapshot.appliedDiscounts.map((discount) => (
                    <div
                      key={discount.id || discount.code || Math.random()}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {discount.name || discount.code || "Discount"}
                        </p>
                        {discount.type && (
                          <p className="text-xs text-muted-foreground">
                            Type: {discount.type}
                          </p>
                        )}
                      </div>
                      {discount.value && (
                        <Badge variant="outline">
                          {discount.valueType === "PERCENTAGE"
                            ? `${discount.value}%`
                            : `₹${discount.value}`}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

            {discountSnapshot.autoDiscounts &&
              discountSnapshot.autoDiscounts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Auto Discounts</p>
                  {discountSnapshot.autoDiscounts.map((discount) => (
                    <div
                      key={discount.id || discount.code || Math.random()}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {discount.name || "Auto Discount"}
                        </p>
                        {discount.type && (
                          <p className="text-xs text-muted-foreground">
                            Type: {discount.type}
                          </p>
                        )}
                      </div>
                      {discount.value && (
                        <Badge variant="outline">
                          {discount.valueType === "PERCENTAGE"
                            ? `${discount.value}%`
                            : `₹${discount.value}`}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

            {discountSnapshot.driftDetected && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Discount drift detected - pricing may have changed since order
                  creation
                </p>
              </div>
            )}
          </>
        )}

        {!discountSnapshot && order.discountCode && (
          <p className="text-xs text-muted-foreground">
            Discount snapshot not available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
