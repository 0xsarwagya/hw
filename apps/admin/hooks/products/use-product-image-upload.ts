"use client";

import { useCallback } from "react";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toast } from "sonner";
import { WIZARD_MESSAGES } from "@/lib/constants/wizard.constants";

/**
 * Hook for handling product image uploads
 * Manages image upload to storage and association with product
 */
export function useProductImageUpload() {
  const uploadImages = useCallback(async (productId: string, images: File[]) => {
    if (images.length === 0) return;

    try {
      for (const file of images) {
        await uploadSingleImage(productId, file);
      }
      toast.success(WIZARD_MESSAGES.IMAGE_UPLOAD_SUCCESS);
    } catch (error) {
      toast.error(WIZARD_MESSAGES.IMAGE_UPLOAD_ERROR);
    }
  }, []);

  return { uploadImages };
}

/**
 * Uploads a single image file
 */
async function uploadSingleImage(productId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("prefix", "products");

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

  await api.post(endpoints.products.images.add(productId), {
    imageKey: uploadData.key || uploadData.url,
    altText: file.name,
  });
}

