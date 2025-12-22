"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";

export function useAdminDeleteBundleSet(bundleId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<{ message: string }, string, FetchError>({
    mutationFn: async (setId: string) => {
      return api.delete<{ message: string }>(
        endpoints.bundles.sets.delete(bundleId, setId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.bundles.detail(bundleId)],
      });
      queryClient.invalidateQueries({ queryKey: [endpoints.bundles.list] });
      toast.success("Bundle set deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete bundle set");
      throw error;
    },
  });
}
