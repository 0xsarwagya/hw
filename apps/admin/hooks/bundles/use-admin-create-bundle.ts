"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useApiMutation } from "../use-api-mutation";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Bundle, CreateBundleInput } from "@/lib/types/bundles";
import { toast } from "sonner";

export function useAdminCreateBundle() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useApiMutation<Bundle, CreateBundleInput, FetchError>({
    mutationFn: async (data) => {
      return api.post<Bundle>(endpoints.bundles.create, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [endpoints.bundles.list] });
      toast.success("Bundle created successfully");
      router.push(`/bundles/${data.id}`);
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

