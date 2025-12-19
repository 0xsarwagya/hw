"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Product, UpdateProductInput } from "@/lib/types/products";
import { toast } from "sonner";

export function useAdminUpdateProduct(productId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<Product, UpdateProductInput>({
    mutationFn: async (data) => {
      return api.put<Product>(endpoints.products.update(productId), data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [endpoints.products.list] });
      queryClient.invalidateQueries({ queryKey: [endpoints.products.detail(productId)] });
      toast.success("Product updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update product");
    },
  });
}

