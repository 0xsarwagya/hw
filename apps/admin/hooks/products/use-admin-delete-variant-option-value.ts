"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toast } from "sonner";

export function useAdminDeleteVariantOptionValue(
  productId: string,
  optionTypeId: string,
) {
  const queryClient = useQueryClient();

  return useApiMutation<{ success: boolean }, { valueId: string }>({
    mutationFn: async ({ valueId }) => {
      return api.delete<{ success: boolean }>(
        endpoints.variantOptionTypes.product.values.delete(
          productId,
          optionTypeId,
          valueId,
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.variantOptionTypes.product.list(productId)],
      });
      toast.success("Variant option value removed successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove variant option value");
    },
  });
}

