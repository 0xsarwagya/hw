"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toast } from "sonner";

export function useAdminToggleProductCollection(productId: string) {
  const queryClient = useQueryClient();

  return {
    addToCollection: useApiMutation<{ message: string; added: number; skipped: number }, { collectionId: string }>({
      mutationFn: async ({ collectionId }) => {
        return api.post<{ message: string; added: number; skipped: number }>(
          endpoints.collections.products.add(collectionId),
          { productIds: [productId] }
        );
      },
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: [endpoints.collections.products.list(variables.collectionId)] });
        queryClient.invalidateQueries({ queryKey: [endpoints.collections.detail(variables.collectionId)] });
        queryClient.invalidateQueries({ queryKey: [endpoints.products.collections(productId)] });
        toast.success(data.message || "Product added to collection");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to add product to collection");
      },
    }),
    removeFromCollection: useApiMutation<{ message: string }, { collectionId: string }>({
      mutationFn: async ({ collectionId }) => {
        return api.delete<{ message: string }>(
          endpoints.collections.products.remove(collectionId, productId)
        );
      },
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: [endpoints.collections.products.list(variables.collectionId)] });
        queryClient.invalidateQueries({ queryKey: [endpoints.collections.detail(variables.collectionId)] });
        queryClient.invalidateQueries({ queryKey: [endpoints.products.collections(productId)] });
        toast.success(data.message || "Product removed from collection");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to remove product from collection");
      },
    }),
  };
}

