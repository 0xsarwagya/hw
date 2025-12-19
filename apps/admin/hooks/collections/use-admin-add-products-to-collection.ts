"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { AddProductsToCollectionInput, AddProductsToCollectionResponse } from "@/lib/types/collections";
import { toast } from "sonner";

export function useAdminAddProductsToCollection(collectionId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<AddProductsToCollectionResponse, AddProductsToCollectionInput>({
    mutationFn: async (data) => {
      return api.post<AddProductsToCollectionResponse>(endpoints.collections.products.add(collectionId), data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [endpoints.collections.products.list(collectionId)] });
      queryClient.invalidateQueries({ queryKey: [endpoints.collections.detail(collectionId)] });
      toast.success(data.message || `Added ${data.added} product(s) to collection`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add products to collection");
    },
  });
}

