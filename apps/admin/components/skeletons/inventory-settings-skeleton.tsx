"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loading component for inventory settings form
 */
export function InventorySettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Global Threshold */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Per-Variant Overrides */}
          <div className="space-y-4">
            <Skeleton className="h-5 w-48" />
            <div className="space-y-2">
              {Array.from(
                { length: 3 },
                (_, i) => `override-skeleton-${i.toString()}`,
              ).map((key) => (
                <div key={key} className="flex items-center gap-4">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-20" />
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}
