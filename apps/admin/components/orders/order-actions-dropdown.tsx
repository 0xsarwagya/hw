"use client";

import {
  Archive,
  Copy,
  Download,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminPaymentReconcile } from "@/hooks/orders/use-admin-payment-reconcile";
import type { Order } from "@/lib/types/orders";

interface OrderActionsDropdownProps {
  order: Order;
  onRefund?: () => void;
  refundDialogOpen?: boolean;
  onRefundDialogChange?: (open: boolean) => void;
}

export function OrderActionsDropdown({
  order,
  onRefund,
  refundDialogOpen,
  onRefundDialogChange,
}: OrderActionsDropdownProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reconcileDialogOpen, setReconcileDialogOpen] = useState(false);
  const reconcileMutation = useAdminPaymentReconcile();

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    toast.success("Order ID copied to clipboard");
  };

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber);
    toast.success("Order number copied to clipboard");
  };

  const handleReconcile = async () => {
    if (!order.razorpayOrderId) return;
    try {
      await reconcileMutation.mutateAsync({
        paymentIntentId: order.razorpayOrderId,
        provider: "razorpay",
      });
      setReconcileDialogOpen(false);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const handleCancelOrder = async () => {
    // TODO: Implement cancel order endpoint
    toast.info("Cancel order feature coming soon");
    setCancelDialogOpen(false);
  };

  const handleDuplicateOrder = () => {
    // TODO: Implement duplicate order feature
    toast.info("Duplicate order feature coming soon");
  };

  const handleArchiveOrder = () => {
    // TODO: Implement archive order feature
    toast.info("Archive order feature coming soon");
  };

  const canReconcile = order.razorpayOrderId && order.paymentStatus !== "completed";
  const canCancel =
    order.status !== "cancelled" &&
    order.status !== "refunded" &&
    order.status !== "delivered";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleCopyOrderId}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Order ID
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyOrderNumber}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Order Number
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="mr-2 h-4 w-4" />
            Download Invoice
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {canReconcile && (
            <Dialog
              open={reconcileDialogOpen}
              onOpenChange={setReconcileDialogOpen}
            >
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reconcile Payment Intent
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reconcile Payment Intent</DialogTitle>
                  <DialogDescription>
                    This will manually reprocess the payment intent to create or
                    update the order. This is safe to call multiple times and is
                    idempotent.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setReconcileDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReconcile}
                    disabled={reconcileMutation.isPending}
                  >
                    {reconcileMutation.isPending ? "Reconciling..." : "Reconcile"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {onRefund && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                if (onRefundDialogChange) {
                  onRefundDialogChange(true);
                } else {
                  onRefund();
                }
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refund Order
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleDuplicateOrder}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate Order
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleArchiveOrder}>
            <Archive className="mr-2 h-4 w-4" />
            Archive Order
          </DropdownMenuItem>
          {canCancel && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  setCancelDialogOpen(true);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel Order
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel Order"
        description={`Are you sure you want to cancel order ${order.orderNumber}? This action cannot be undone.`}
        confirmText="Cancel Order"
        cancelText="Keep Order"
        variant="destructive"
        onConfirm={handleCancelOrder}
      />
    </>
  );
}

