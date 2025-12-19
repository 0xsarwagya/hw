"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { VariantOptionType } from "@/lib/types/products";
import type { CreateVariantOptionTypeInput } from "@/lib/validations/variant-option-types";
import { toast } from "sonner";

export function useAdminCreateVariantOptionType() {
  const queryClient = useQueryClient();

  return useApiMutation<VariantOptionType, CreateVariantOptionTypeInput>({
    mutationFn: async (data) => {
      return api.post<VariantOptionType>(endpoints.variantOptionTypes.create, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.variantOptionTypes.list] });
      toast.success("Variant option type created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create variant option type");
    },
  });
}

