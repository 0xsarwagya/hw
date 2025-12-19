"use client";

import { ShoppingCart } from "lucide-react";
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
import { useAdminPaymentReconcile } from "@/hooks/orders/use-admin-payment-reconcile";

interface ConvertToOrderDialogProps {
  paymentIntentId: string;
}

export function ConvertToOrderDialog({
  paymentIntentId,
}: ConvertToOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const reconcile = useAdminPaymentReconcile();

  const handleConvert = async () => {
    await reconcile.mutateAsync({ paymentIntentId });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Convert to Order
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert to Order</DialogTitle>
          <DialogDescription>
            This will reconcile the payment intent and create an order. This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={reconcile.isPending}>
            {reconcile.isPending ? "Converting..." : "Convert to Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
