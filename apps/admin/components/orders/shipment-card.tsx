"use client";

import { Download, ExternalLink, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDownloadLabel } from "@/hooks/shipping/use-download-label";
import type { ShipmentTracking } from "@/lib/types/shipping";
import { CancelShipmentDialog } from "./cancel-shipment-dialog";
import { DateTime } from "./date-time";
import { ShipmentTrackingDialog } from "./shipment-tracking-dialog";

interface ShipmentCardProps {
  shipment: ShipmentTracking;
}

export function ShipmentCard({ shipment }: ShipmentCardProps) {
  const { downloadLabel } = useDownloadLabel();
  const canCancel =
    shipment.status !== "delivered" &&
    shipment.status !== "cancelled" &&
    shipment.status !== "failed";

  const handleDownloadLabel = () => {
    if (shipment.awbNumber) {
      downloadLabel({
        shipmentId: shipment.id,
        awb: shipment.awbNumber,
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{shipment.provider}</span>
              <Badge variant="outline">{shipment.status}</Badge>
            </div>
            {shipment.awbNumber && (
              <p className="text-sm text-muted-foreground">
                AWB: <span className="font-mono">{shipment.awbNumber}</span>
              </p>
            )}
            {shipment.trackingNumber && (
              <p className="text-sm text-muted-foreground">
                Tracking:{" "}
                <span className="font-mono">{shipment.trackingNumber}</span>
              </p>
            )}
            <DateTime date={shipment.createdAt} format="short" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {shipment.labelUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadLabel}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Label
                </Button>
              )}
              {shipment.awbNumber && (
                <ShipmentTrackingDialog
                  awb={shipment.awbNumber}
                  trackingNumber={shipment.trackingNumber}
                  trigger={
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Track
                    </Button>
                  }
                />
              )}
            </div>
            {canCancel && shipment.awbNumber && (
              <CancelShipmentDialog
                awb={shipment.awbNumber}
                shipmentId={shipment.id}
                trigger={
                  <Button variant="outline" size="sm" className="w-full">
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
