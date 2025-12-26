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
      // Backend returns paginated response: { data: [...], total, page, limit, totalPages, hasNextPage, hasPreviousPage }
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
 * Slug format: title-slug-{last8charsOfId}
 * Strategy:
 * 1. Extract bundle ID from slug (last 8 chars after last dash)
 * 2. Try to fetch bundle directly by ID (if we can extract a full UUID)
 * 3. Fall back to searching through bundles if direct fetch fails
 */
export const useBundleBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["bundles", "slug", slug],
    queryFn: async () => {
      if (!slug) {
        throw new Error("Slug is required");
      }

      // Extract potential bundle ID from slug
      // Slug format: title-slug-{last8charsOfId}
      // Try to extract the last 8 characters after the last dash
      const parts = slug.split("-");
      const lastPart = parts[parts.length - 1];
      
      // If last part looks like a UUID fragment (8 hex chars), try to find full UUID
      // We'll search through bundles to find one with matching last 8 chars
      if (lastPart && lastPart.length === 8 && /^[0-9a-f]{8}$/i.test(lastPart)) {
        // Fetch bundles with higher limit to increase chances of finding it
        let page = 1;
        const limit = 100;
        let foundBundle: Bundle | null = null;
        
        // Search through multiple pages if needed
        while (!foundBundle && page <= 10) { // Limit to 10 pages (1000 bundles max)
          const url = `${endpoints.bundles.list}?page=${page}&limit=${limit}`;
          const data = await get(url);
          const paginatedResponse = paginatedBundlesSchema.parse(data);
          const bundles = paginatedResponse.data;

          // Try to find bundle by matching last 8 chars of ID
          foundBundle = bundles.find((b) => {
            const bundleIdSuffix = b.id.slice(-8).toLowerCase();
            return bundleIdSuffix === lastPart.toLowerCase();
          }) || null;

          // Also check if slug matches generated slug
          if (!foundBundle) {
            foundBundle = bundles.find((b) => {
              const bundleSlug = `${b.title
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^\w-]/g, "")}-${b.id.slice(-8)}`;
              return bundleSlug === slug || b.id === slug;
            }) || null;
          }

          // If we found it or there are no more pages, break
          if (foundBundle || !paginatedResponse.hasNextPage) {
            break;
          }

          page++;
        }

        if (foundBundle) {
          return foundBundle;
        }
      } else {
        // If slug doesn't match expected format, try direct search
        // Fetch bundles and search by generated slug
        let page = 1;
        const limit = 100;
        
        while (page <= 10) { // Limit to 10 pages
          const url = `${endpoints.bundles.list}?page=${page}&limit=${limit}`;
          const data = await get(url);
          const paginatedResponse = paginatedBundlesSchema.parse(data);
          const bundles = paginatedResponse.data;

          const bundle = bundles.find((b) => {
            const bundleSlug = `${b.title
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w-]/g, "")}-${b.id.slice(-8)}`;
            return bundleSlug === slug || b.id === slug;
          });

          if (bundle) {
            return bundle;
          }

          if (!paginatedResponse.hasNextPage) {
            break;
          }

          page++;
        }
      }

      // Bundle not found after searching
      throw new Error("Bundle not found");
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    retry: 1, // Retry once in case of network issues
  });
};
