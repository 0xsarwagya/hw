"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { CreateVariantInput, Variant } from "@/lib/types/products";
import { useApiMutation } from "../use-api-mutation";

export function useAdminCreateVariant(productId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<Variant, CreateVariantInput>({
    mutationFn: async (data) => {
      return api.post<Variant>(endpoints.products.variants.create(productId), {
        ...data,
        productId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.products.variants.list(productId)],
      });
      queryClient.invalidateQueries({
        queryKey: [endpoints.products.detail(productId)],
      });
      toast.success("Variant created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create variant");
    },
  });
}
