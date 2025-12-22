"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints, get, post } from "@/lib/api/client";
import {
  paginatedProductsSchema,
  paginatedReviewsSchema,
  productSchema,
  variantSchema,
} from "@/lib/validations/product";

/**
 * Get products with filters
 */
export function useProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: "price" | "name" | "date";
  sortOrder?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.search) searchParams.set("search", params.search);
      if (params?.categoryId) searchParams.set("categoryId", params.categoryId);
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
        ? `${endpoints.products.list}?${queryString}`
        : endpoints.products.list;
      const data = await get(url);
      return paginatedProductsSchema.parse(data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get product by ID
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: async () => {
      const data = await get(endpoints.products.detail(id));
      return productSchema.parse(data);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get product variants
 */
export function useProductVariants(productId: string) {
  return useQuery({
    queryKey: ["products", productId, "variants"],
    queryFn: async () => {
      const data = await get(endpoints.products.variants(productId));
      return Array.isArray(data) ? data.map((v) => variantSchema.parse(v)) : [];
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get product reviews
 */
export function useProductReviews(productId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["products", productId, "reviews", page, limit],
    queryFn: async () => {
      const url = `${endpoints.products.reviews(productId)}?page=${page}&limit=${limit}`;
      const data = await get(url);
      return paginatedReviewsSchema.parse(data);
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get product recommendations
 */
export function useProductRecommendations(productId: string) {
  return useQuery({
    queryKey: ["products", productId, "recommendations"],
    queryFn: async () => {
      const data = await get(endpoints.products.recommendations(productId));
      return Array.isArray(data) ? data.map((p) => productSchema.parse(p)) : [];
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Advanced product search with ranking
 */
export function useProductSearch(params: {
  query: string;
  page?: number;
  limit?: number;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: "relevance" | "price" | "name" | "date";
  sortOrder?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: ["products", "search", params],
    queryFn: async () => {
      const data = (await post<{
        results?: Array<{
          id: string;
          title: string;
          description: string | null;
          price: number;
          relevanceScore: number;
          matchingSku?: string | null;
        }>;
        total?: number;
      }>(endpoints.products.search, {
        query: params.query,
        page: params.page || 1,
        limit: params.limit || 10,
        categoryId: params.categoryId,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        inStock: params.inStock,
        sortBy: params.sortBy || "relevance",
        sortOrder: params.sortOrder || "desc",
      })) as unknown;
      // Search returns SearchResponseDto which has results array with scores
      // Convert SearchResultDto to Product format
      if (
        data &&
        typeof data === "object" &&
        "results" in data &&
        Array.isArray(data.results)
      ) {
        const searchData = data as {
          results: Array<{
            id: string;
            title: string;
            description: string | null;
            price: number;
            relevanceScore: number;
            matchingSku?: string | null;
          }>;
          total?: number;
        };
        return {
          data: searchData.results.map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            price: r.price,
            gstRate: 0,
            pricingType: "inclusive" as const,
            gstAmount: 0,
            priceExcludingGst: r.price,
            priceIncludingGst: r.price,
            hsnCode: null,
            status: "active" as const,
            categoryId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
          total: searchData.total || searchData.results.length,
          page: params.page || 1,
          limit: params.limit || 10,
          totalPages: Math.ceil(
            (searchData.total || searchData.results.length) /
              (params.limit || 10),
          ),
          hasNextPage:
            (params.page || 1) <
            Math.ceil(
              (searchData.total || searchData.results.length) /
                (params.limit || 10),
            ),
          hasPreviousPage: (params.page || 1) > 1,
        };
      }
      return paginatedProductsSchema.parse(data);
    },
    enabled: !!params.query && params.query.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Filter and sort products
 */
export function useProductFilter(params?: {
  page?: number;
  limit?: number;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  status?: "draft" | "active" | "archived";
  sortBy?: "price" | "name" | "date";
  sortOrder?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: ["products", "filter", params],
    queryFn: async () => {
      const data = await post(endpoints.products.filter, {
        page: params?.page || 1,
        limit: params?.limit || 10,
        categoryId: params?.categoryId,
        minPrice: params?.minPrice,
        maxPrice: params?.maxPrice,
        inStock: params?.inStock,
        status: params?.status || "active",
        sortBy: params?.sortBy || "date",
        sortOrder: params?.sortOrder || "desc",
      });
      return paginatedProductsSchema.parse(data);
    },
    staleTime: 5 * 60 * 1000,
  });
}
