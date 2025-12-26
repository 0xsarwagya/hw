"use client";

import { Calendar, Package, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Bundle } from "@/lib/types/bundles";
import { DateTime } from "../orders/date-time";

interface BundleSummaryCardProps {
  bundle: Bundle;
}

/**
 * Bundle summary card showing key metrics and information
 */
export function BundleSummaryCard({ bundle }: BundleSummaryCardProps) {
  const totalSets = bundle.sets?.length || 0;
  const totalVariants =
    bundle.sets?.reduce((sum, set) => sum + (set.items?.length || 0), 0) || 0;

  const setsWithVariants =
    bundle.sets?.filter((set) => (set.items?.length || 0) > 0).length || 0;
  const setsWithoutVariants = totalSets - setsWithVariants;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Bundle Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Status</div>
            <div>
              <Badge variant={bundle.isActive ? "default" : "secondary"}>
                {bundle.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Total Sets</div>
            <div className="text-2xl font-semibold">{totalSets}</div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Total Variants</div>
            <div className="text-2xl font-semibold">{totalVariants}</div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Mix & Match</div>
            <div>
              <Badge variant={bundle.allowMixAndMatch ? "default" : "outline"}>
                {bundle.allowMixAndMatch ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
        </div>

        {totalSets > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Sets Status:</span>
              <Badge variant="default" className="bg-green-600">
                {setsWithVariants} complete
              </Badge>
              {setsWithoutVariants > 0 && (
                <>
                  <span className="text-muted-foreground">/</span>
                  <Badge variant="destructive">
                    {setsWithoutVariants} empty
                  </Badge>
                </>
              )}
            </div>
          </div>
        )}

        <div className="pt-4 border-t space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Created:</span>
            <DateTime date={bundle.createdAt} />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Updated:</span>
            <DateTime date={bundle.updatedAt} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
