"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";
import { DateTime } from "./date-time";
import type { ShipmentTracking } from "@/lib/types/shipping";

interface ShipmentCardProps {
  shipment: ShipmentTracking;
}

export function ShipmentCard({ shipment }: ShipmentCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
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
                Tracking: <span className="font-mono">{shipment.trackingNumber}</span>
              </p>
            )}
            <DateTime date={shipment.createdAt} format="short" />
          </div>
          <div className="flex gap-2">
            {shipment.labelUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={shipment.labelUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-1" />
                  Label
                </a>
              </Button>
            )}
            {shipment.trackingNumber && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://shiprocket.co/tracking/${shipment.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Track
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

