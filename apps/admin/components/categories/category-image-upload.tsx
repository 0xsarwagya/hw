"use client";

import { Upload, X } from "lucide-react";
import Image from "next/image";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { FormSection } from "@/components/common/form-section";
import { Button } from "@/components/ui/button";
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "@/lib/constants/messages.constants";
import { endpoints } from "@/lib/endpoints";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/types/categories";

interface CategoryImageUploadProps {
  form: UseFormReturn<CreateCategoryInput | UpdateCategoryInput>;
  imageUrl: string | null;
  isUploading: boolean;
  onImageChange: (url: string | null) => void;
  onUploadingChange: (uploading: boolean) => void;
}

/**
 * Component for category image upload
 */
export function CategoryImageUpload({
  form,
  imageUrl,
  isUploading,
  onImageChange,
  onUploadingChange,
}: CategoryImageUploadProps) {
  const handleImageUpload = async (file: File) => {
    onUploadingChange(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prefix", "categories");

      // Use Next.js API proxy route to ensure cookies are properly forwarded
      const uploadResponse = await fetch("/api/admin/storage/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }

      const uploadData = await uploadResponse.json();
      const url = uploadData.url || uploadData.key;
      onImageChange(url);
      form.setValue("imageUrl", url);
      toast.success(SUCCESS_MESSAGES.IMAGE_UPLOADED);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : ERROR_MESSAGES.FAILED_TO_UPLOAD_IMAGE(),
      );
    } finally {
      onUploadingChange(false);
    }
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    form.setValue("imageUrl", undefined);
  };

  return (
    <FormSection
      title="Category Image"
      description="Upload an image for this category"
    >
      {imageUrl ? (
        <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border">
          <Image
            src={imageUrl}
            alt="Category"
            fill
            className="object-cover"
            unoptimized
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8">
          <label className="flex flex-col items-center justify-center cursor-pointer">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              Click to upload or drag and drop
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImageUpload(file);
                }
              }}
              disabled={isUploading}
            />
          </label>
        </div>
      )}
      {isUploading && (
        <p className="text-sm text-muted-foreground">Uploading...</p>
      )}
    </FormSection>
  );
}
