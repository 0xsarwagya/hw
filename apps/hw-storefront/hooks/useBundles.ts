import { useQuery } from "@tanstack/react-query";
import { endpoints, get } from "../lib/api/client";
import {
  type Bundle,
  bundleSchema,
  paginatedBundlesSchema,
} from "../lib/validations/bundle";

export const QUERY_KEYS = {
  bundles: ["bundles"],
  bundle: (id: string) => ["bundles", id],
};

export const useBundles = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: [QUERY_KEYS.bundles, page, limit],
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
};

export const useBundle = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.bundle(id),
    queryFn: async () => {
      const data = await get(endpoints.bundles.detail(id));
      return bundleSchema.parse(data);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Find bundle by slug
 * First fetches all bundles, then finds the one matching the slug
 */
export const useBundleBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["bundles", "slug", slug],
    queryFn: async () => {
      // Fetch all bundles
      const url = `${endpoints.bundles.list}?limit=100`;
      const data = await get(url);
      const bundles = Array.isArray(data)
        ? data.map((b) => bundleSchema.parse(b))
        : paginatedBundlesSchema.parse(data).data;

      // Find bundle matching slug
      // Slug format: title-slug-{last8charsOfId}
      const bundle = bundles.find((b) => {
        const bundleSlug = `${b.title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, "")}-${b.id.slice(-8)}`;
        return bundleSlug === slug || b.id === slug;
      });

      if (!bundle) {
        throw new Error("Bundle not found");
      }

      return bundle;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
};
