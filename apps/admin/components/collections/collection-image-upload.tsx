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
  CreateCollectionInput,
  UpdateCollectionInput,
} from "@/lib/types/collections";

interface CollectionImageUploadProps {
  form: UseFormReturn<CreateCollectionInput | UpdateCollectionInput>;
  imageUrl: string | null;
  isUploading: boolean;
  onImageChange: (url: string | null) => void;
  onUploadingChange: (uploading: boolean) => void;
}

/**
 * Component for collection image upload
 */
export function CollectionImageUpload({
  form,
  imageUrl,
  isUploading,
  onImageChange,
  onUploadingChange,
}: CollectionImageUploadProps) {
  const handleImageUpload = async (file: File) => {
    onUploadingChange(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prefix", "collections");

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
      title="Collection Image"
      description="Upload a cover image for the collection"
    >
      {imageUrl ? (
        <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border">
          <Image
            src={imageUrl}
            alt="Collection cover"
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
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            Upload a collection cover image
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
            className="hidden"
            id="collection-image-upload"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              document.getElementById("collection-image-upload")?.click()
            }
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Select Image"}
          </Button>
        </div>
      )}
    </FormSection>
  );
}
