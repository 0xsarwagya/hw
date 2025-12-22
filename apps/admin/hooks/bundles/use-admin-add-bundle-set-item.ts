"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { AddBundleSetItemInput } from "@/lib/types/bundles";
import { useApiMutation } from "../use-api-mutation";

export function useAdminAddBundleSetItem(bundleId: string, setId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<
    { id: string; message: string },
    AddBundleSetItemInput,
    FetchError
  >({
    mutationFn: async (data) => {
      return api.post<{ id: string; message: string }>(
        endpoints.bundles.sets.items.add(bundleId, setId),
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.bundles.detail(bundleId)],
      });
      toast.success("Item added to bundle set successfully");
    },
    onError: (error) => {
      if (error.errors && Object.keys(error.errors).length > 0) {
        const fieldErrors = Object.entries(error.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        toast.error(`Validation errors:\n${fieldErrors}`, { duration: 5000 });
      } else {
        toast.error(error.message || "Failed to add item to bundle set");
      }
      throw error;
    },
  });
}
