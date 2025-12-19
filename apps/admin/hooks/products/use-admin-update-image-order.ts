"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { UpdateImageOrderInput } from "@/lib/types/products";
import { toast } from "sonner";

export function useAdminUpdateImageOrder(productId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<{ message: string }, UpdateImageOrderInput & { imageId: string }>({
    mutationFn: async ({ imageId, ...data }) => {
      return api.put<{ message: string }>(endpoints.products.images.updateOrder(imageId), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.products.images.list(productId)] });
      queryClient.invalidateQueries({ queryKey: [endpoints.products.detail(productId)] });
      toast.success("Image order updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update image order");
    },
  });
}

