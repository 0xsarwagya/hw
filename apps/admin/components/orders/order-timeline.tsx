"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  MessageSquare,
  Package,
  RefreshCw,
  ShoppingCart,
  User,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  OrderTimeline as OrderTimelineType,
  TimelineActor,
} from "@/lib/types/orders";
import { DateTime } from "./date-time";

interface OrderTimelineProps {
  timeline: OrderTimelineType;
}

const getEventIcon = (type: string) => {
  if (type.includes("completed") || type.includes("delivered")) {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
  if (type.includes("failed") || type.includes("cancelled")) {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }
  if (type.includes("payment")) {
    return <CreditCard className="h-4 w-4 text-blue-500" />;
  }
  if (type.includes("shipment") || type.includes("shipping")) {
    return <Package className="h-4 w-4 text-purple-500" />;
  }
  if (type.includes("note")) {
    return <MessageSquare className="h-4 w-4 text-orange-500" />;
  }
  if (type.includes("address")) {
    return <MapPin className="h-4 w-4 text-teal-500" />;
  }
  if (type.includes("refund")) {
    return <RefreshCw className="h-4 w-4 text-yellow-500" />;
  }
  if (type.includes("cart") || type.includes("checkout")) {
    return <ShoppingCart className="h-4 w-4 text-indigo-500" />;
  }
  if (type.includes("rate_limit") || type.includes("warning")) {
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  }
  return <Clock className="h-4 w-4 text-muted-foreground" />;
};

const getActorBadge = (actor?: TimelineActor) => {
  if (!actor) return null;

  const config = {
    system: { label: "System", variant: "secondary" as const },
    admin: { label: "Admin", variant: "default" as const },
    customer: { label: "Customer", variant: "outline" as const },
    automated: { label: "Automated", variant: "secondary" as const },
  };

  const actorConfig = config[actor] || config.system;
  return (
    <Badge variant={actorConfig.variant} className="text-xs">
      {actorConfig.label}
    </Badge>
  );
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
              <div
                key={`timeline-event-${index}-${event.type}-${event.timestamp}`}
                className="flex gap-4"
              >
                <div className="flex flex-col items-center">
                  {getEventIcon(event.type)}
                  {index < timeline.events.length - 1 && (
                    <div className="w-0.5 h-full bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{event.title}</p>
                        {getActorBadge(event.actor)}
                        {event.actorName && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {event.actorName}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                      {event.previousValue && event.newValue && (
                        <p className="text-xs text-muted-foreground">
                          {event.previousValue} → {event.newValue}
                        </p>
                      )}
                      {(event.traceId || event.spanId || event.requestId) && (
                        <div className="flex items-center gap-2 flex-wrap mt-2 pt-2 border-t">
                          {event.traceId && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                    trace: {event.traceId.slice(0, 8)}...
                                  </code>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Trace ID: {event.traceId}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {event.spanId && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                    span: {event.spanId.slice(0, 8)}...
                                  </code>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Span ID: {event.spanId}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {event.requestId && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                    req: {event.requestId.slice(0, 8)}...
                                  </code>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Request ID: {event.requestId}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      )}
                      {event.metadata &&
                        Object.keys(event.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">
                              View metadata
                            </summary>
                            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </details>
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
