"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { ProductImage, UpdateImageInput } from "@/lib/types/products";
import { useApiMutation } from "../../use-api-mutation";

export function useUpdateImage(productId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<ProductImage, UpdateImageInput & { imageId: string }>({
    mutationFn: async ({ imageId, ...data }) => {
      return api.patch<ProductImage>(
        endpoints.products.images.update(imageId),
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
      toast.success("Image updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update image");
    },
  });
}
