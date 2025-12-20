"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCancelShipment } from "@/hooks/shipping/use-cancel-shipment";

interface CancelShipmentDialogProps {
  awb: string;
  shipmentId?: string;
  trigger?: React.ReactNode;
}

export function CancelShipmentDialog({
  awb,
  shipmentId: _shipmentId,
  trigger,
}: CancelShipmentDialogProps) {
  const [open, setOpen] = useState(false);
  const cancelShipment = useCancelShipment();

  const handleCancel = async () => {
    try {
      await cancelShipment.mutateAsync({ awb });
      setOpen(false);
    } catch (_error) {
      // Error handled by mutation hook
    }
  };

  return (
    <>
      {trigger && (
        <button
          type="button"
          className="inline-flex items-center"
          onClick={() => setOpen(true)}
        >
          {trigger}
        </button>
      )}
      {!trigger && (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Cancel Shipment
        </Button>
      )}
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Cancel Shipment"
        description={`Are you sure you want to cancel shipment with AWB ${awb}? This action cannot be undone.`}
        confirmText="Cancel Shipment"
        cancelText="Keep Shipment"
        variant="destructive"
        onConfirm={handleCancel}
        isLoading={cancelShipment.isPending}
      />
    </>
  );
}
