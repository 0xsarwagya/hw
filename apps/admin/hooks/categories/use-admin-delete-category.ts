"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toast } from "sonner";

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

