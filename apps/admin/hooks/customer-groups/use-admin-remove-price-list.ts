"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";

export function useAdminRemovePriceList(groupId: string, priceListId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<void, void, FetchError>({
    mutationFn: async () => {
      return api.delete<void>(
        endpoints.customerGroups.removePriceList(groupId, priceListId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.customerGroups.detail(groupId)],
      });
      toast.success("Price list removed successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove price list");
      throw error;
    },
  });
}
