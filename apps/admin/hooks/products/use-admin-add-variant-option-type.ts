"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { ProductVariantOptionType } from "@/lib/types/products";
import type { CreateProductVariantOptionTypeInput } from "@/lib/validations/variant-option-types";
import { useApiMutation } from "../use-api-mutation";

export function useAdminAddVariantOptionType(productId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<
    ProductVariantOptionType,
    CreateProductVariantOptionTypeInput
  >({
    mutationFn: async (data) => {
      return api.post<ProductVariantOptionType>(
        endpoints.variantOptionTypes.product.create(productId),
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.variantOptionTypes.product.list(productId)],
      });
      queryClient.invalidateQueries({
        queryKey: [endpoints.products.detail(productId)],
      });
      toast.success("Variant option type added successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add variant option type");
    },
  });
}
