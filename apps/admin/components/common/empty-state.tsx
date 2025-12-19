import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Reusable empty state component
 * Provides consistent empty state display across the application
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  const hasAction = actionLabel && (actionHref || onAction);

  return (
    <div className={cn("text-center py-8 text-muted-foreground", className)}>
      <p className="text-lg font-medium mb-2">{title}</p>
      {description && <p className="text-sm mb-4">{description}</p>}
      {hasAction &&
        (actionHref ? (
          <Button asChild variant="outline">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : (
          <Button variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        ))}
    </div>
  );
}
