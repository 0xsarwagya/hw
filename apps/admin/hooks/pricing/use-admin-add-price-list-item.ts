"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type {
  CreatePriceListItemInput,
  PriceListItem,
} from "@/lib/types/price-lists";
import { useApiMutation } from "../use-api-mutation";

export function useAdminAddPriceListItem(priceListId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<PriceListItem, CreatePriceListItemInput, FetchError>({
    mutationFn: async (data) => {
      return api.post<PriceListItem>(
        endpoints.priceLists.addItem(priceListId),
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.priceLists.detail(priceListId)],
      });
      toast.success("Price list item added successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add price list item");
      throw error;
    },
  });
}
