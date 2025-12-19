"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant = "default" | "secondary" | "destructive" | "outline";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

const STATUS_VARIANTS: Record<string, StatusVariant> = {
  active: "default",
  inactive: "secondary",
  approved: "default",
  rejected: "destructive",
  pending: "secondary",
  draft: "secondary",
  archived: "outline",
};

/**
 * Reusable status badge component
 * Provides consistent status badge styling across the application
 */
export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const badgeVariant = variant || STATUS_VARIANTS[status.toLowerCase()] || "secondary";
  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <Badge variant={badgeVariant} className={cn(className)}>
      {displayStatus}
    </Badge>
  );
}

