"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentStatusBadge } from "./payment-status-badge";
import { Button } from "@/components/ui/button";
import { Money } from "./money";
import { toast } from "sonner";
import type { Order } from "@/lib/types/orders";

interface OrderPaymentSectionProps {
  order: Order;
}

export function OrderPaymentSection({ order }: OrderPaymentSectionProps) {
  const isCOD = order.paymentMethod === "COD";
  const isPaid = order.paymentStatus === "completed";

  const handleMarkCODAsPaid = async () => {
    // TODO: Implement COD payment capture endpoint
    toast.info("COD payment capture feature coming soon");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Payment Method</span>
          <span className="font-medium">{order.paymentMethod || "N/A"}</span>
        </div>
        {order.paymentStatus && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Payment Status</span>
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        )}
        {order.razorpayOrderId && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Payment Intent ID</span>
            <span className="text-sm font-mono">{order.razorpayOrderId}</span>
          </div>
        )}
        {isCOD && !isPaid && (
          <Button className="w-full" variant="default" onClick={handleMarkCODAsPaid}>
            Mark COD as Paid
          </Button>
        )}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="font-medium">Amount</span>
            <Money amount={order.total} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

