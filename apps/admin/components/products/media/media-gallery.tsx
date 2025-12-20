"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { ProductImage } from "@/lib/types/products";
import { MediaInspector } from "./media-inspector";

interface MediaGalleryProps {
  productImages: ProductImage[];
  variantImages?: ProductImage[];
  productId: string;
  onImageChange?: () => void;
}

export function MediaGallery({
  productImages,
  variantImages = [],
  productId,
  onImageChange,
}: MediaGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const handleImageClick = useCallback((image: ProductImage) => {
    setSelectedImage(image);
    setInspectorOpen(true);
  }, []);

  const featuredImage = productImages.find((img) => img.order === 0);
  const additionalImages = productImages.filter((img) => img.order !== 0);

  return (
    <div className="space-y-6">
      {/* Featured Image */}
      {featuredImage && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Featured Image</h3>
          <Card
            className="cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleImageClick(featuredImage)}
          >
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <Image
                  src={featuredImage.url}
                  alt={featuredImage.altText || "Featured product image"}
                  fill
                  className="object-cover rounded-lg"
                  unoptimized
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Product Images */}
      {additionalImages.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Additional Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {additionalImages.map((image) => (
              <Card
                key={image.id}
                className="cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleImageClick(image)}
              >
                <CardContent className="p-0">
                  <div className="relative aspect-square">
                    <Image
                      src={image.url}
                      alt={image.altText || `Product image ${image.order}`}
                      fill
                      className="object-cover rounded-lg"
                      unoptimized
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Variant Images */}
      {variantImages.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Variant Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {variantImages.map((image) => (
              <Card
                key={image.id}
                className="cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleImageClick(image)}
              >
                <CardContent className="p-0">
                  <div className="relative aspect-square">
                    <Image
                      src={image.url}
                      alt={image.altText || `Variant image ${image.order}`}
                      fill
                      className="object-cover rounded-lg"
                      unoptimized
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Media Inspector */}
      <MediaInspector
        image={selectedImage}
        productId={productId}
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
        onImageChange={onImageChange}
      />
    </div>
  );
}
