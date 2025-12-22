"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints, get } from "@/lib/api/client";
import { categorySchema, categoryTreeSchema } from "@/lib/validations/category";
import { paginatedProductsSchema } from "@/lib/validations/product";

/**
 * Get all categories
 */
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const data = await get(endpoints.categories.list);
      return Array.isArray(data)
        ? data.map((c) => categorySchema.parse(c))
        : [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get category tree
 */
export function useCategoryTree() {
  return useQuery({
    queryKey: ["categories", "tree"],
    queryFn: async () => {
      const data = await get(endpoints.categories.tree);
      return Array.isArray(data)
        ? data.map((c) => categoryTreeSchema.parse(c))
        : [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get category by ID
 */
export function useCategory(id: string) {
  return useQuery({
    queryKey: ["categories", id],
    queryFn: async () => {
      const data = await get(endpoints.categories.detail(id));
      return categorySchema.parse(data);
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get category by slug
 */
export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: ["categories", "slug", slug],
    queryFn: async () => {
      const data = await get(endpoints.categories.bySlug(slug));
      return categorySchema.parse(data);
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get products in a category
 */
export function useCategoryProducts(
  id: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: "price" | "name" | "date";
    sortOrder?: "asc" | "desc";
  },
) {
  return useQuery({
    queryKey: ["categories", id, "products", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.search) searchParams.set("search", params.search);
      if (params?.minPrice)
        searchParams.set("minPrice", params.minPrice.toString());
      if (params?.maxPrice)
        searchParams.set("maxPrice", params.maxPrice.toString());
      if (params?.inStock !== undefined)
        searchParams.set("inStock", params.inStock.toString());
      if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
      if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

      const queryString = searchParams.toString();
      const url = queryString
        ? `${endpoints.categories.products(id)}?${queryString}`
        : endpoints.categories.products(id);
      const data = await get(url);
      return paginatedProductsSchema.parse(data);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
