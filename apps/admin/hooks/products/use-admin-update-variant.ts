"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Variant, UpdateVariantInput } from "@/lib/types/products";
import { toast } from "sonner";

export function useAdminUpdateVariant(productId: string, variantId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<Variant, UpdateVariantInput>({
    mutationFn: async (data) => {
      return api.put<Variant>(endpoints.products.variants.update(productId, variantId), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.products.variants.list(productId)] });
      queryClient.invalidateQueries({ queryKey: [endpoints.products.variants.detail(productId, variantId)] });
      queryClient.invalidateQueries({ queryKey: [endpoints.products.detail(productId)] });
      toast.success("Variant updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update variant");
    },
  });
}

