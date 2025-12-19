"use client";

import { Badge } from "@/components/ui/badge";
import type { FulfillmentStatus } from "@/lib/types/orders";
import { cn } from "@/lib/utils";

interface FulfillmentStatusBadgeProps {
  status: FulfillmentStatus;
  className?: string;
}

const statusConfig: Record<
  FulfillmentStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  unfulfilled: { label: "Unfulfilled", variant: "outline" },
  partially_fulfilled: { label: "Partially Fulfilled", variant: "secondary" },
  fulfilled: { label: "Fulfilled", variant: "default" },
  shipped: { label: "Shipped", variant: "default" },
  delivered: { label: "Delivered", variant: "default" },
};

export function FulfillmentStatusBadge({
  status,
  className,
}: FulfillmentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  );
}
