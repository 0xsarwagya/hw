"use client";

import { endpoints } from "@/lib/endpoints";
import type { Category, CategoryQueryParams } from "@/lib/types/categories";
import { useApiQuery } from "../use-api-query";

export function useAdminCategories(params?: CategoryQueryParams) {
  return useApiQuery<Category[]>(endpoints.categories.list, {
    params: params as Record<string, string | number | boolean | undefined>,
    enabled: true,
  });
}

export function useAdminCategoryTree() {
  return useApiQuery<Category[]>(endpoints.categories.tree, {
    enabled: true,
  });
}

export function useAdminCategory(id: string) {
  return useApiQuery<Category>(endpoints.categories.detail(id), {
    enabled: !!id,
  });
}
