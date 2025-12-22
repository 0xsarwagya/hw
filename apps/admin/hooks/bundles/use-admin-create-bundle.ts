"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Bundle, CreateBundleInput } from "@/lib/types/bundles";
import { useApiMutation } from "../use-api-mutation";

export function useAdminCreateBundle() {
  const queryClient = useQueryClient();
  const _router = useRouter();

  return useApiMutation<Bundle, CreateBundleInput, FetchError>({
    mutationFn: async (data) => {
      return api.post<Bundle>(endpoints.bundles.create, data);
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: [endpoints.bundles.list] });
      toast.success("Bundle created successfully");
      // Don't redirect immediately - let the page handle navigation
      // so users can add sets first
    },
    onError: (error) => {
      if (error.errors && Object.keys(error.errors).length > 0) {
        const fieldErrors = Object.entries(error.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        toast.error(`Validation errors:\n${fieldErrors}`, { duration: 5000 });
      } else {
        toast.error(error.message || "Failed to create bundle");
      }
      throw error;
    },
  });
}
