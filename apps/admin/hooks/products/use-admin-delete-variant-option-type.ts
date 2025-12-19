"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toast } from "sonner";

export function useAdminDeleteVariantOptionType(productId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<{ success: boolean }, { optionTypeId: string }>({
    mutationFn: async ({ optionTypeId }) => {
      return api.delete<{ success: boolean }>(
        endpoints.variantOptionTypes.product.delete(productId, optionTypeId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.variantOptionTypes.product.list(productId)],
      });
      queryClient.invalidateQueries({
        queryKey: [endpoints.products.detail(productId)],
      });
      toast.success("Variant option type removed successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove variant option type");
    },
  });
}

