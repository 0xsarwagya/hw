"use client";

import { Badge } from "@/components/ui/badge";
import { STATUS_VARIANTS } from "@/lib/constants/status.constants";
import { cn } from "@/lib/utils";

type StatusVariant = "default" | "secondary" | "destructive" | "outline";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

/**
 * Reusable status badge component
 * Provides consistent status badge styling across the application
 * Uses status constants for variant mapping
 */
export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const badgeVariant =
    variant ||
    (STATUS_VARIANTS[status.toLowerCase() as keyof typeof STATUS_VARIANTS] as
      | StatusVariant
      | undefined) ||
    "secondary";
  const displayStatus =
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <Badge variant={badgeVariant} className={cn(className)}>
      {displayStatus}
    </Badge>
  );
}
