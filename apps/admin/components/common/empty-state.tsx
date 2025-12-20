import {
  Boxes,
  FileText,
  Package,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react";
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
  icon?: React.ReactNode;
  type?:
    | "products"
    | "orders"
    | "customers"
    | "discounts"
    | "bundles"
    | "default";
}

const typeIcons = {
  products: Package,
  orders: ShoppingCart,
  customers: Users,
  discounts: Tag,
  bundles: Boxes,
  default: FileText,
};

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
  icon,
  type = "default",
}: EmptyStateProps) {
  const hasAction = actionLabel && (actionHref || onAction);
  const IconComponent = icon || typeIcons[type];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4",
        className,
      )}
    >
      {IconComponent && (
        <div className="mb-4 text-muted-foreground">
          {typeof IconComponent === "function" ? (
            <IconComponent className="h-12 w-12" />
          ) : (
            IconComponent
          )}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-md text-center">
          {description}
        </p>
      )}
      {hasAction &&
        (actionHref ? (
          <Button asChild variant="default">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : (
          <Button variant="default" onClick={onAction}>
            {actionLabel}
          </Button>
        ))}
    </div>
  );
}
