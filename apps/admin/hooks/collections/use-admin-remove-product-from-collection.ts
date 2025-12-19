"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";

export function useAdminRemoveProductFromCollection(collectionId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<{ message: string }, string>({
    mutationFn: async (productId: string) => {
      return api.delete<{ message: string }>(
        endpoints.collections.products.remove(collectionId, productId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.collections.products.list(collectionId)],
      });
      queryClient.invalidateQueries({
        queryKey: [endpoints.collections.detail(collectionId)],
      });
      toast.success("Product removed from collection successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove product from collection");
    },
  });
}
