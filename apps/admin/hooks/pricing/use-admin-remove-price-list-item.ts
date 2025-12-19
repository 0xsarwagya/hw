"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";

export function useAdminRemovePriceListItem(
  priceListId: string,
  itemId: string,
) {
  const queryClient = useQueryClient();

  return useApiMutation<void, void, FetchError>({
    mutationFn: async () => {
      return api.delete<void>(
        endpoints.priceLists.removeItem(priceListId, itemId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.priceLists.detail(priceListId)],
      });
      toast.success("Price list item removed successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove price list item");
      throw error;
    },
  });
}
