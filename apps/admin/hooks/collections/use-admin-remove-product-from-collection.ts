"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toast } from "sonner";

export function useAdminRemoveProductFromCollection(collectionId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<{ message: string }, string>({
    mutationFn: async (productId: string) => {
      return api.delete<{ message: string }>(endpoints.collections.products.remove(collectionId, productId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.collections.products.list(collectionId)] });
      queryClient.invalidateQueries({ queryKey: [endpoints.collections.detail(collectionId)] });
      toast.success("Product removed from collection successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove product from collection");
    },
  });
}

