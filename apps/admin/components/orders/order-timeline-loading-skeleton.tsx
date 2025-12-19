import { Card, CardContent } from "@/components/ui/card";

/**
 * Loading skeleton for order timeline component
 * Provides consistent loading state UI
 */
export function OrderTimelineLoadingSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}
