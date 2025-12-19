"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Category, CreateCategoryInput } from "@/lib/types/categories";
import { useApiMutation } from "../use-api-mutation";

export function useAdminCreateCategory() {
  const queryClient = useQueryClient();

  return useApiMutation<Category, CreateCategoryInput>({
    mutationFn: async (data) => {
      return api.post<Category>(endpoints.categories.create, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.categories.list] });
      queryClient.invalidateQueries({ queryKey: [endpoints.categories.tree] });
      toast.success("Category created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create category");
    },
  });
}
