"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints, get } from "@/lib/api/client";
import { paginatedProductsSchema } from "@/lib/validations/product";

/**
 * Unified search
 */
export function useSearch(query: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["search", query, page, limit],
    queryFn: async () => {
      const url = `${endpoints.search.global}?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
      const data = await get(url);
      return paginatedProductsSchema.parse(data);
    },
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
