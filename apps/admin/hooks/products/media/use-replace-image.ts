"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { ProductImage, ReplaceImageInput } from "@/lib/types/products";
import { useApiMutation } from "../../use-api-mutation";

export function useReplaceImage(productId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<ProductImage, ReplaceImageInput & { imageId: string }>({
    mutationFn: async ({ imageId, ...data }) => {
      return api.put<ProductImage>(
        endpoints.products.images.replace(imageId),
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
      toast.success("Image replaced successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to replace image");
    },
  });
}
