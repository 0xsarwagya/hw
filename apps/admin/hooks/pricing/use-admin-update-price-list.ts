"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { PriceList, UpdatePriceListInput } from "@/lib/types/price-lists";
import { toast } from "sonner";

export function useAdminUpdatePriceList(priceListId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<PriceList, UpdatePriceListInput, FetchError>({
    mutationFn: async (data) => {
      return api.put<PriceList>(endpoints.priceLists.update(priceListId), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.priceLists.list] });
      queryClient.invalidateQueries({ queryKey: [endpoints.priceLists.active] });
      queryClient.invalidateQueries({ queryKey: [endpoints.priceLists.detail(priceListId)] });
      toast.success("Price list updated successfully");
    },
    onError: (error) => {
      if (error.errors && Object.keys(error.errors).length > 0) {
        const fieldErrors = Object.entries(error.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        toast.error(`Validation errors:\n${fieldErrors}`, { duration: 5000 });
      } else {
        toast.error(error.message || "Failed to update price list");
      }
      throw error;
    },
  });
}

