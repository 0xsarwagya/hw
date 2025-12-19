"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";

export function useAdminStorageDelete() {
  const queryClient = useQueryClient();

  return useApiMutation<void, string, FetchError>({
    mutationFn: async (key: string) => {
      return api.delete<void>(endpoints.storage.delete(key));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.storage.list] });
      toast.success("File deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete file");
      throw error;
    },
  });
}
