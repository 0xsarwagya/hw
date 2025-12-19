"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toast } from "sonner";

export function useAdminDeleteVariant(productId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<{ message: string }, string>({
    mutationFn: async (variantId: string) => {
      return api.delete<{ message: string }>(endpoints.products.variants.delete(productId, variantId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.products.variants.list(productId)] });
      queryClient.invalidateQueries({ queryKey: [endpoints.products.detail(productId)] });
      toast.success("Variant deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete variant");
    },
  });
}

