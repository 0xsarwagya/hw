"use client";

import { Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useReplaceImage } from "@/hooks/products/media/use-replace-image";
import { useUpdateImage } from "@/hooks/products/media/use-update-image";
import { useAdminDeleteProductImage } from "@/hooks/products/use-admin-delete-product-image";
import { endpoints } from "@/lib/endpoints";
import type { ProductImage } from "@/lib/types/products";

interface MediaInspectorProps {
  image: ProductImage | null;
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageChange?: () => void;
}

export function MediaInspector({
  image,
  productId,
  open,
  onOpenChange,
  onImageChange,
}: MediaInspectorProps) {
  const [altText, setAltText] = useState(image?.altText || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateImage = useUpdateImage(productId);
  const replaceImage = useReplaceImage(productId);
  const deleteImage = useAdminDeleteProductImage(productId);

  // Update altText when image changes
  useEffect(() => {
    setAltText(image?.altText || "");
  }, [image]);

  const handleSaveAltText = useCallback(async () => {
    if (!image) return;

    try {
      await updateImage.mutateAsync({
        imageId: image.id,
        altText: altText || null,
      });
      onImageChange?.();
    } catch (_error) {
      // Error toast is handled by the hook
    }
  }, [image, altText, updateImage, onImageChange]);

  const handleReplace = useCallback(
    async (file: File) => {
      if (!image) return;

      try {
        // Upload new file
        const formData = new FormData();
        formData.append("file", file);
        formData.append("prefix", image.variantId ? "variants" : "products");

        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const uploadResponse = await fetch(
          `${API_URL}${endpoints.storage.upload}`,
          {
            method: "POST",
            body: formData,
            credentials: "include",
          },
        );

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.message || "Upload failed");
        }

        const uploadData = await uploadResponse.json();
        const imageKey = uploadData.key || uploadData.url;

        // Replace image
        await replaceImage.mutateAsync({
          imageId: image.id,
          imageKey,
        });

        onImageChange?.();
        toast.success("Image replaced successfully");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to replace image",
        );
      }
    },
    [image, replaceImage, onImageChange],
  );

  const handleDelete = useCallback(async () => {
    if (!image) return;

    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      await deleteImage.mutateAsync({ imageId: image.id });
      onImageChange?.();
      onOpenChange(false);
    } catch (_error) {
      // Error toast is handled by the hook
    }
  }, [image, deleteImage, onImageChange, onOpenChange]);

  if (!image) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Image Details</SheetTitle>
          <SheetDescription>
            Edit image properties and metadata
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Thumbnail Preview */}
          <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-muted">
            <Image
              src={image.url}
              alt={image.altText || "Product image"}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Alt Text Editor */}
          <div className="space-y-2">
            <label htmlFor="alt-text" className="text-sm font-medium">
              Alt Text
            </label>
            <Textarea
              id="alt-text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Enter alt text for accessibility"
              rows={3}
            />
            <Button
              onClick={handleSaveAltText}
              disabled={updateImage.isPending}
              size="sm"
            >
              Save Alt Text
            </Button>
          </div>

          {/* Replace Image */}
          <div className="space-y-2">
            <label htmlFor="replace-image" className="text-sm font-medium">
              Replace Image
            </label>
            <input
              id="replace-image"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleReplace(file);
                }
              }}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={replaceImage.isPending}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Replace Image
            </Button>
          </div>

          {/* Metadata */}
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-sm font-medium">Metadata</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Order: {image.order}</div>
              <div>
                Created: {new Date(image.createdAt).toLocaleDateString()}
              </div>
              {image.variantId && <div>Variant Image: Yes</div>}
            </div>
          </div>

          {/* Delete Button */}
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteImage.isPending}
            className="w-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Image
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
