"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { UpdateBundleSetInput } from "@/lib/types/bundles";
import { useApiMutation } from "../use-api-mutation";

export function useAdminUpdateBundleSet(bundleId: string, setId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<{ message: string }, UpdateBundleSetInput, FetchError>({
    mutationFn: async (data) => {
      return api.patch<{ message: string }>(
        endpoints.bundles.sets.update(bundleId, setId),
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.bundles.detail(bundleId)],
      });
      queryClient.invalidateQueries({ queryKey: [endpoints.bundles.list] });
      toast.success("Bundle set updated successfully");
    },
    onError: (error) => {
      if (error.errors && Object.keys(error.errors).length > 0) {
        const fieldErrors = Object.entries(error.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        toast.error(`Validation errors:\n${fieldErrors}`, { duration: 5000 });
      } else {
        toast.error(error.message || "Failed to update bundle set");
      }
      throw error;
    },
  });
}
