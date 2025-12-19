"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";

export function useAdminDeleteBundle() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useApiMutation<{ message: string }, string, FetchError>({
    mutationFn: async (bundleId: string) => {
      return api.delete<{ message: string }>(
        endpoints.bundles.delete(bundleId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.bundles.list] });
      toast.success("Bundle deleted successfully");
      router.push("/bundles");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete bundle");
      throw error;
    },
  });
}
