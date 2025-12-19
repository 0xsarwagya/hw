"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { AddProductImageInput, ProductImage } from "@/lib/types/products";
import { useApiMutation } from "../use-api-mutation";

export function useAdminUploadProductImage(productId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<ProductImage, AddProductImageInput>({
    mutationFn: async (data) => {
      return api.post<ProductImage>(
        endpoints.products.images.add(productId),
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.products.images.list(productId)],
      });
      queryClient.invalidateQueries({
        queryKey: [endpoints.products.detail(productId)],
      });
      toast.success("Image uploaded successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload image");
    },
  });
}
