"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints, get } from "@/lib/api/client";
import { collectionSchema } from "@/lib/validations/collection";
import { paginatedProductsSchema } from "@/lib/validations/product";

/**
 * Get all collections
 */
export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const data = await get(endpoints.collections.list);
      return Array.isArray(data)
        ? data.map((c) => collectionSchema.parse(c))
        : [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get single collection by ID
 */
export function useCollection(id: string) {
  return useQuery({
    queryKey: ["collections", id],
    queryFn: async () => {
      const data = await get(endpoints.collections.detail(id));
      return collectionSchema.parse(data);
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get products in a collection
 */
export function useCollectionProducts(id: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["collections", id, "products", page, limit],
    queryFn: async () => {
      const url = `${endpoints.collections.products(id)}?page=${page}&limit=${limit}`;
      const data = await get(url);
      return paginatedProductsSchema.parse(data);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
