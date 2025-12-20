"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InventoryItem } from "@/lib/types/inventory";

interface VariantSummaryCardProps {
  item: InventoryItem;
}

/**
 * Card component displaying variant summary information
 */
export function VariantSummaryCard({ item }: VariantSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{item.title}</CardTitle>
          <Link
            href={`/products/${item.productId}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View Product →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">SKU</p>
          <p className="font-mono text-sm font-medium">{item.sku}</p>
        </div>
        {item.attributes && Object.keys(item.attributes).length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Attributes</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(item.attributes).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {item.description && (
          <div>
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="text-sm">{item.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
