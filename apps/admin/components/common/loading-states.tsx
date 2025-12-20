"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  className?: string;
  count?: number;
}

/**
 * Skeleton loader for table rows
 */
export function TableRowSkeleton({ count = 5 }: LoadingStateProps) {
  const items = useMemo(() => {
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(`table-row-${crypto.randomUUID()}`);
    }
    return ids;
  }, [count]);

  return (
    <>
      {items.map((id) => (
        <tr key={id}>
          <td colSpan={100}>
            <div className="flex items-center gap-4 p-4">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/**
 * Skeleton loader for form fields
 */
export function FormFieldSkeleton({ count = 3 }: LoadingStateProps) {
  const items = useMemo(() => {
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(`form-field-${crypto.randomUUID()}`);
    }
    return ids;
  }, [count]);

  return (
    <div className="space-y-4">
      {items.map((id) => (
        <div key={id} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for card content
 */
export function CardSkeleton({ className }: LoadingStateProps) {
  return (
    <div className={cn("space-y-4 p-6", className)}>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/**
 * Skeleton loader for list items
 */
export function ListItemSkeleton({ count = 5 }: LoadingStateProps) {
  const items = useMemo(() => {
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(`list-item-${crypto.randomUUID()}`);
    }
    return ids;
  }, [count]);

  return (
    <div className="space-y-2">
      {items.map((id) => (
        <div key={id} className="flex items-center gap-3 p-3 border rounded">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Inline loading spinner
 */
export function InlineLoader({ className }: LoadingStateProps) {
  return (
    <div className={cn("flex items-center justify-center p-4", className)}>
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
