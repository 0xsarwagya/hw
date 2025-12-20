"use client";

import { ExternalLink, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTrackShipment } from "@/hooks/shipping/use-track-shipment";
import { DateTime } from "./date-time";

interface ShipmentTrackingDialogProps {
  awb: string;
  trackingNumber?: string | null;
  trigger?: React.ReactNode;
}

export function ShipmentTrackingDialog({
  awb,
  trackingNumber,
  trigger,
}: ShipmentTrackingDialogProps) {
  const { data: tracking, isLoading } = useTrackShipment(awb, !!awb);

  return (
    <Dialog>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <button
            type="button"
            className="text-sm text-primary hover:underline"
          >
            Track Shipment
          </button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Shipment Tracking</DialogTitle>
          <DialogDescription>
            Tracking information for AWB: {awb}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading tracking information...
          </div>
        ) : tracking ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{tracking.status}</p>
              </div>
              {tracking.estimatedDeliveryDate && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Estimated Delivery
                  </p>
                  <p className="font-medium">
                    {new Date(
                      tracking.estimatedDeliveryDate,
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {tracking.events && tracking.events.length > 0 ? (
              <div className="space-y-3">
                <p className="font-medium">Tracking History</p>
                <div className="space-y-3">
                  {tracking.events.map((event) => (
                    <div
                      key={event.date || Math.random().toString()}
                      className="flex gap-4 border-l-2 border-primary pl-4"
                    >
                      <Package className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{event.status}</p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                        )}
                        {event.location && (
                          <p className="text-sm text-muted-foreground">
                            {event.location}
                          </p>
                        )}
                        <DateTime date={event.date} format="short" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tracking events available yet
              </p>
            )}

            {trackingNumber && (
              <div className="pt-4 border-t">
                <a
                  href={`https://shiprocket.co/tracking/${trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  View on Shiprocket <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No tracking information available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
