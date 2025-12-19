"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toast } from "sonner";

export function useAdminDeleteProductImage(productId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<{ message: string }, { imageId: string }>({
    mutationFn: async ({ imageId }) => {
      return api.delete<{ message: string }>(endpoints.products.images.delete(imageId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.products.images.list(productId)] });
      queryClient.invalidateQueries({ queryKey: [endpoints.products.detail(productId)] });
      toast.success("Image deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete image");
    },
  });
}

