"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints, get } from "@/lib/api/client";
import { bundleSchema, paginatedBundlesSchema } from "@/lib/validations/bundle";

/**
 * Get bundles list
 */
export function useBundles(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["bundles", page, limit],
    queryFn: async () => {
      const url = `${endpoints.bundles.list}?page=${page}&limit=${limit}`;
      const data = await get(url);
      // Backend returns array or paginated response
      if (Array.isArray(data)) {
        return {
          data: data.map((b) => bundleSchema.parse(b)),
          total: data.length,
          page,
          limit,
          totalPages: Math.ceil(data.length / limit),
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }
      return paginatedBundlesSchema.parse(data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get single bundle by ID
 */
export function useBundle(id: string) {
  return useQuery({
    queryKey: ["bundles", id],
    queryFn: async () => {
      const data = await get(endpoints.bundles.detail(id));
      return bundleSchema.parse(data);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}
