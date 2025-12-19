"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Discount, UpdateDiscountInput } from "@/lib/types/discounts";
import { useApiMutation } from "../use-api-mutation";

export function useAdminUpdateDiscount(id: string) {
  const queryClient = useQueryClient();

  return useApiMutation<Discount, UpdateDiscountInput, FetchError>({
    mutationFn: async (data) => {
      return api.put<Discount>(endpoints.discounts.update(id), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.discounts.list] });
      queryClient.invalidateQueries({
        queryKey: [endpoints.discounts.detail(id)],
      });
      toast.success("Discount updated successfully");
    },
    onError: (error) => {
      if (error.errors && Object.keys(error.errors).length > 0) {
        const fieldErrors = Object.entries(error.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        toast.error(`Validation errors:\n${fieldErrors}`, { duration: 5000 });
      } else {
        toast.error(error.message || "Failed to update discount");
      }
      throw error;
    },
  });
}
