"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProductImage } from "@/lib/types/products";
import dynamic from "next/dynamic";

const ImageManager = dynamic(
  () =>
    import("@/components/products/image-manager").then((mod) => ({
      default: mod.ImageManager,
    })),
  { loading: () => <div className="h-32 animate-pulse bg-muted rounded" /> }
);

interface ProductImagesTabProps {
  productId: string;
  images: ProductImage[];
}

/**
 * Images tab component for product editing
 * Manages product image uploads and ordering
 */
export function ProductImagesTab({ productId, images }: ProductImagesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Images</CardTitle>
        <CardDescription>Upload and manage product images</CardDescription>
      </CardHeader>
      <CardContent>
        <ImageManager
          productId={productId}
          images={images}
          onImagesChange={() => {}}
        />
      </CardContent>
    </Card>
  );
}

