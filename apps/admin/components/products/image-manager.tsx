"use client";

import { useState, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminUploadProductImage } from "@/hooks/products/use-admin-upload-product-image";
import { useAdminDeleteProductImage } from "@/hooks/products/use-admin-delete-product-image";
import { endpoints } from "@/lib/endpoints";
import type { ProductImage } from "@/lib/types/products";
import { toast } from "sonner";

interface ImageManagerProps {
  productId: string;
  images: ProductImage[];
  variantId?: string;
  onImagesChange?: () => void;
  disabled?: boolean;
}

export function ImageManager({
  productId,
  images,
  variantId,
  onImagesChange,
  disabled = false,
}: ImageManagerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const uploadImage = useAdminUploadProductImage(productId);
  const deleteImage = useAdminDeleteProductImage(productId);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || !productId || disabled) return;

      for (const file of Array.from(files)) {
        try {
          // Upload to storage
          const formData = new FormData();
          formData.append("file", file);
          formData.append("prefix", variantId ? "variants" : "products");

          // Upload directly to backend - cookies sent automatically
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
          const uploadResponse = await fetch(`${API_URL}${endpoints.storage.upload}`, {
            method: "POST",
            body: formData,
            credentials: "include",
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(errorData.message || "Upload failed");
          }

          const uploadData = await uploadResponse.json();

          // Add image to product
          await uploadImage.mutateAsync({
            imageKey: uploadData.key || uploadData.url,
            variantId,
          });

          onImagesChange?.();
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    },
    [productId, variantId, uploadImage, onImagesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDelete = useCallback(
    async (imageId: string) => {
      if (confirm("Are you sure you want to delete this image?")) {
        await deleteImage.mutateAsync({ imageId });
        onImagesChange?.();
      }
    },
    [deleteImage, onImagesChange]
  );

  const sortedImages = [...images].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop images here, or click to select
        </p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="image-upload"
        />
        <Button
          variant="outline"
          onClick={() => document.getElementById("image-upload")?.click()}
          disabled={uploadImage.isPending || disabled || !productId}
        >
          Select Images
        </Button>
      </div>

      {sortedImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sortedImages.map((image, index) => (
            <Card key={image.id} className="relative group">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <img
                    src={image.url}
                    alt={image.altText || `Product image ${index + 1}`}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDelete(image.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Primary
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

