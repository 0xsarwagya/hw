"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Category, UpdateCategoryInput } from "@/lib/types/categories";
import { useApiMutation } from "../use-api-mutation";

export function useAdminUpdateCategory(id: string) {
  const queryClient = useQueryClient();

  return useApiMutation<Category, UpdateCategoryInput>({
    mutationFn: async (data) => {
      return api.put<Category>(endpoints.categories.update(id), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.categories.list] });
      queryClient.invalidateQueries({ queryKey: [endpoints.categories.tree] });
      queryClient.invalidateQueries({
        queryKey: [endpoints.categories.detail(id)],
      });
      toast.success("Category updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update category");
    },
  });
}
