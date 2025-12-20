"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateRefund } from "@/hooks/orders/use-admin-refunds";
import type { Order } from "@/lib/types/orders";
import { Money } from "./money";

interface RefundDialogProps {
  order: Order;
  trigger?: React.ReactNode;
}

export function RefundDialog({ order, trigger }: RefundDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(order.total.toString());
  const [reason, setReason] = useState("");
  const [initiatePaymentRefund, setInitiatePaymentRefund] = useState(true);

  const createRefund = useCreateRefund();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const refundAmount = parseFloat(amount);
    if (isNaN(refundAmount) || refundAmount <= 0) {
      return;
    }
    if (refundAmount > order.total) {
      return;
    }

    try {
      await createRefund.mutateAsync({
        orderId: order.id,
        amount: refundAmount,
        reason: reason || undefined,
        initiatePaymentRefund,
      });
      setOpen(false);
      setAmount(order.total.toString());
      setReason("");
      setInitiatePaymentRefund(true);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const isFullRefund = parseFloat(amount) === order.total;
  const refundAmount = parseFloat(amount) || 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Refund Order
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refund Order</DialogTitle>
          <DialogDescription>
            Create a refund for order {order.orderNumber}. You can issue a
            partial or full refund.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="refund-amount">Refund Amount</Label>
            <div className="flex items-center gap-2">
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                min="0"
                max={order.total}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(order.total.toString())}
              >
                Full Refund
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Order total: <Money amount={order.total} />
              {refundAmount > 0 && (
                <>
                  {" "}
                  · Refund: <Money amount={refundAmount} />
                  {!isFullRefund && (
                    <>
                      {" "}
                      · Remaining:{" "}
                      <Money amount={order.total - refundAmount} />
                    </>
                  )}
                </>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refund-reason">Reason (Optional)</Label>
            <Textarea
              id="refund-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Customer requested refund, Product damaged"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="initiate-payment-refund"
              checked={initiatePaymentRefund}
              onCheckedChange={(checked) =>
                setInitiatePaymentRefund(checked === true)
              }
            />
            <Label
              htmlFor="initiate-payment-refund"
              className="text-sm font-normal cursor-pointer"
            >
              Initiate payment refund with provider (Razorpay)
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createRefund.isPending ||
                refundAmount <= 0 ||
                refundAmount > order.total
              }
            >
              {createRefund.isPending ? "Processing..." : "Create Refund"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

