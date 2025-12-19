"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { VariantOptionValue } from "@/lib/types/products";
import type { CreateVariantOptionValueInput } from "@/lib/validations/variant-option-types";
import { toast } from "sonner";

export function useAdminAddVariantOptionValue(
  productId: string,
  optionTypeId: string,
) {
  const queryClient = useQueryClient();

  return useApiMutation<VariantOptionValue, CreateVariantOptionValueInput>({
    mutationFn: async (data) => {
      return api.post<VariantOptionValue>(
        endpoints.variantOptionTypes.product.values.create(productId, optionTypeId),
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.variantOptionTypes.product.list(productId)],
      });
      toast.success("Variant option value added successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add variant option value");
    },
  });
}

