import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { endpoints, get } from "../lib/api/client";

// Category schema based on backend structure
const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string().optional(),
  description: z.string().nullable(),
  image: z.string().nullable(),
  parentId: z.string().uuid().nullable(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

const paginatedCategoriesSchema = z.object({
  data: z.array(categorySchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export type Category = z.infer<typeof categorySchema>;

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const data = await get(endpoints.categories.list);
      // Backend may return array or paginated response
      if (Array.isArray(data)) {
        return {
          data: data.map((c) => categorySchema.parse(c)),
          total: data.length,
          page: 1,
          limit: data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      }
      return paginatedCategoriesSchema.parse(data);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCategory = (id: string | undefined) => {
  return useQuery({
    queryKey: ["categories", id],
    queryFn: async () => {
      if (!id) return null;
      const data = await get(endpoints.categories.detail(id));
      return categorySchema.parse(data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
};

export const useCategoryBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["categories", "slug", slug],
    queryFn: async () => {
      if (!slug) return null;
      const data = await get(endpoints.categories.bySlug(slug));
      return categorySchema.parse(data);
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
  });
};
