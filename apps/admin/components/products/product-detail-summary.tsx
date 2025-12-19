"use client";

import { Money } from "@/components/orders/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product, Variant } from "@/lib/types/products";
import { ProductStatusBadge } from "./product-status-badge";

interface ProductDetailSummaryProps {
  product: Product;
  variants: Variant[];
}

/**
 * Summary sidebar component for product detail page
 * Displays key product information and statistics
 */
export function ProductDetailSummary({
  product,
  variants,
}: ProductDetailSummaryProps) {
  const minPrice =
    variants.length > 0
      ? Math.min(...variants.map((v) => v.salePrice || v.price))
      : product.price;
  const maxPrice =
    variants.length > 0
      ? Math.max(...variants.map((v) => v.salePrice || v.price))
      : product.price;
  const totalInventory = variants.reduce((sum, v) => sum + v.inventory, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Status</div>
            <ProductStatusBadge status={product.status} />
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Price Range</div>
            <div className="font-medium">
              {minPrice === maxPrice ? (
                <Money amount={minPrice} />
              ) : (
                <>
                  <Money amount={minPrice} /> - <Money amount={maxPrice} />
                </>
              )}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Variants</div>
            <div className="font-medium">{variants.length}</div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground">Total Inventory</div>
            <div className="font-medium">{totalInventory}</div>
          </div>
        </CardContent>
      </Card>

      {variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {variants.slice(0, 3).map((variant) => (
              <div
                key={variant.id}
                className="flex justify-between items-center"
              >
                <div className="text-sm">
                  {variant.size || variant.color || "Default"}
                </div>
                <div
                  className={`text-sm font-medium ${
                    variant.inventory <= 0 ? "text-destructive" : ""
                  }`}
                >
                  {variant.inventory}
                </div>
              </div>
            ))}
            {variants.length > 3 && (
              <div className="text-sm text-muted-foreground text-center">
                +{variants.length - 3} more
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
