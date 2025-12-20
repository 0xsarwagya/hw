"use client";

import { User, UserX } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Order } from "@/lib/types/orders";

interface OrderCustomerCardProps {
  order: Order;
}

export function OrderCustomerCard({ order }: OrderCustomerCardProps) {
  const isGuest = !order.customerId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isGuest ? (
            <UserX className="h-5 w-5" />
          ) : (
            <User className="h-5 w-5" />
          )}
          Customer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isGuest ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Guest Checkout</Badge>
              </div>
              {order.customerEmail && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.customerEmail}</p>
                </div>
              )}
              {order.shippingAddress?.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.shippingAddress.phone}</p>
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" className="w-full" disabled>
              Convert to Customer (Coming Soon)
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              {order.customerName && (
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <Link
                    href={`/customers/${order.customerId}`}
                    className="font-medium hover:underline"
                  >
                    {order.customerName}
                  </Link>
                </div>
              )}
              {order.customerEmail && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.customerEmail}</p>
                </div>
              )}
              {order.shippingAddress?.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.shippingAddress.phone}</p>
                </div>
              )}
            </div>
            <div className="pt-2 border-t">
              <Link href={`/customers/${order.customerId}`}>
                <Button variant="outline" size="sm" className="w-full">
                  View Customer Profile
                </Button>
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
