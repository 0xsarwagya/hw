"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";

export function useAdminRemoveBundleSetItem(bundleId: string, setId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<{ message: string }, string, FetchError>({
    mutationFn: async (itemId: string) => {
      return api.delete<{ message: string }>(
        endpoints.bundles.sets.items.remove(bundleId, setId, itemId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.bundles.detail(bundleId)],
      });
      toast.success("Item removed from bundle set successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove item from bundle set");
      throw error;
    },
  });
}
