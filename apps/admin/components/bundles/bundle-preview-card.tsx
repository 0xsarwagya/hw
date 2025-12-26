"use client";

import { Package, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Bundle } from "@/lib/types/bundles";

interface BundlePreviewCardProps {
  bundle: Bundle;
  className?: string;
}

/**
 * Bundle preview card showing a quick summary
 * Useful for showing bundle info during creation/editing
 */
export function BundlePreviewCard({
  bundle,
  className,
}: BundlePreviewCardProps) {
  const totalSets = bundle.sets?.length || 0;
  const totalVariants = bundle.sets?.reduce(
    (sum, set) => sum + (set.items?.length || 0),
    0,
  ) || 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Bundle Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{bundle.title}</h3>
          {bundle.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {bundle.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Badge variant={bundle.isActive ? "default" : "secondary"}>
            {bundle.isActive ? "Active" : "Inactive"}
          </Badge>
          {bundle.allowMixAndMatch && (
            <Badge variant="outline">Mix & Match</Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <ShoppingBag className="h-4 w-4" />
              Sets
            </div>
            <div className="text-2xl font-semibold">{totalSets}</div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Package className="h-4 w-4" />
              Variants
            </div>
            <div className="text-2xl font-semibold">{totalVariants}</div>
          </div>
        </div>

        {totalSets > 0 && (
          <div className="pt-2 border-t space-y-2">
            <div className="text-sm font-medium">Choice Sets:</div>
            <div className="space-y-1">
              {bundle.sets?.slice(0, 3).map((set, index) => (
                <div
                  key={set.id}
                  className="text-sm flex items-center justify-between"
                >
                  <span>
                    {index + 1}. {set.title}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {set.items?.length || 0} variants
                  </Badge>
                </div>
              ))}
              {totalSets > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{totalSets - 3} more set{totalSets - 3 !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

