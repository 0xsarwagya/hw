"use client";

import { Package2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Bundle } from "@/lib/types/bundles";

interface BundleDetailOverviewProps {
  bundle: Bundle;
}

/**
 * Bundle detail overview showing sets and their status
 */
export function BundleDetailOverview({ bundle }: BundleDetailOverviewProps) {
  const sets = bundle.sets || [];

  if (sets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Choice Sets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No choice sets created yet. Add sets to allow customers to choose
              products.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choice Sets Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sets.map((set, index) => {
            const variantCount = set.items?.length || 0;
            const isComplete = variantCount > 0;

            return (
              <div
                key={set.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{set.title}</span>
                      <Badge
                        variant={isComplete ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {variantCount} variant{variantCount !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    {set.description && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {set.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {set.minQuantity === set.maxQuantity
                          ? `Select ${set.minQuantity}`
                          : `Select ${set.minQuantity}-${set.maxQuantity}`}
                      </Badge>
                    </div>
                  </div>
                </div>
                {!isComplete && (
                  <Badge variant="destructive" className="ml-2">
                    Empty
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
