"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";

export function useAdminDeleteCategory() {
  const queryClient = useQueryClient();

  return useApiMutation<void, string>({
    mutationFn: async (id) => {
      return api.delete<void>(endpoints.categories.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.categories.list] });
      queryClient.invalidateQueries({ queryKey: [endpoints.categories.tree] });
      toast.success("Category deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete category");
    },
  });
}
