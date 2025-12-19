"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTime } from "./date-time";
import type { OrderTimeline } from "@/lib/types/orders";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderTimelineProps {
  timeline: OrderTimeline;
}

const getEventIcon = (type: string) => {
  if (type.includes("completed") || type.includes("delivered")) {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
  if (type.includes("failed") || type.includes("cancelled")) {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }
  return <Clock className="h-4 w-4 text-muted-foreground" />;
};

export function OrderTimeline({ timeline }: OrderTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet</p>
          ) : (
            timeline.events.map((event, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  {getEventIcon(event.type)}
                  {index < timeline.events.length - 1 && (
                    <div className="w-0.5 h-full bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                      {event.previousValue && event.newValue && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {event.previousValue} → {event.newValue}
                        </p>
                      )}
                    </div>
                    <DateTime date={event.timestamp} format="short" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

