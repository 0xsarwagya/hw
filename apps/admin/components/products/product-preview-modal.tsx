"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductStatusBadge } from "./product-status-badge";
import { Money } from "../orders/money";
import type { Product, ProductImage, Variant } from "@/lib/types/products";

interface ProductPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  images?: ProductImage[];
  variants?: Variant[];
  collections?: Array<{ id: string; name: string }>;
}

export function ProductPreviewModal({
  open,
  onOpenChange,
  product,
  images = [],
  variants = [],
  collections = [],
}: ProductPreviewModalProps) {
  if (!product) return null;

  const productImages = images.filter((img) => !img.variantId);
  const firstImage = productImages[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Product Preview</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Product Image */}
          {firstImage && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
              <img
                src={firstImage.url}
                alt={firstImage.altText || product.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{product.title}</h2>
              <div className="mt-2">
                <ProductStatusBadge status={product.status} />
              </div>
            </div>

            {product.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                <p className="text-sm">{product.description}</p>
              </div>
            )}

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Price</h3>
                <div className="text-lg font-semibold">
                  <Money amount={product.priceIncludingGst} />
                </div>
                {product.pricingType === "inclusive" ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Price includes GST ({product.gstRate}%)
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Price excludes GST ({product.gstRate}%)
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">GST Amount</h3>
                <div className="text-lg font-semibold">
                  <Money amount={product.gstAmount} />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-4">
              {product.hsnCode && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">HSN Code</h3>
                  <p className="text-sm">{product.hsnCode}</p>
                </div>
              )}
              {product.gstRate > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">GST Rate</h3>
                  <p className="text-sm">{product.gstRate}%</p>
                </div>
              )}
            </div>

            {/* Variants */}
            {variants.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Variants</h3>
                <div className="space-y-2">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between p-2 border rounded-md"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {variant.size || variant.color || "Default"}
                        </div>
                        <div className="text-xs text-muted-foreground">{variant.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          <Money amount={variant.salePrice || variant.price} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Stock: {variant.inventory}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collections */}
            {collections.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Collections</h3>
                <div className="flex flex-wrap gap-2">
                  {collections.map((collection) => (
                    <span
                      key={collection.id}
                      className="px-2 py-1 bg-muted rounded-md text-sm"
                    >
                      {collection.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Images */}
            {productImages.length > 1 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Images</h3>
                <div className="grid grid-cols-4 gap-2">
                  {productImages.slice(1).map((image) => (
                    <div
                      key={image.id}
                      className="relative aspect-square rounded-md overflow-hidden bg-muted"
                    >
                      <img
                        src={image.url}
                        alt={image.altText || `Product image ${image.order}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

