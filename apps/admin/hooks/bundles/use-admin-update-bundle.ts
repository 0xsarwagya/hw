"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Bundle, UpdateBundleInput } from "@/lib/types/bundles";
import { useApiMutation } from "../use-api-mutation";

export function useAdminUpdateBundle(bundleId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<Bundle, UpdateBundleInput, FetchError>({
    mutationFn: async (data) => {
      return api.patch<Bundle>(endpoints.bundles.update(bundleId), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.bundles.list] });
      queryClient.invalidateQueries({
        queryKey: [endpoints.bundles.detail(bundleId)],
      });
      toast.success("Bundle updated successfully");
    },
    onError: (error) => {
      if (error.errors && Object.keys(error.errors).length > 0) {
        const fieldErrors = Object.entries(error.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        toast.error(`Validation errors:\n${fieldErrors}`, { duration: 5000 });
      } else {
        toast.error(error.message || "Failed to update bundle");
      }
      throw error;
    },
  });
}
