import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { del, endpoints, get, post, put } from "../lib/api/client";
import { removeToken, setToken } from "../lib/utils/storage";
import type { LoginInput, RegisterInput } from "../lib/validations/auth";
import {
  authResponseSchema,
  loginSchema,
  registerSchema,
  userProfileSchema,
} from "../lib/validations/auth";
import { collectionSchema } from "../lib/validations/collection";
import type {
  Product as BackendProduct,
  PaginatedProducts,
  ReviewAggregate,
  Variant,
} from "../lib/validations/product";
import {
  paginatedProductsSchema,
  paginatedReviewsSchema,
  productSchema,
  reviewAggregateSchema,
  reviewSchema,
  variantSchema,
} from "../lib/validations/product";

// --- Query Keys ---
export const QUERY_KEYS = {
  products: ["products"],
  product: (id: string) => ["product", id],
  productVariants: (id: string) => ["product", id, "variants"],
  reviews: ["reviews"],
  productReviews: (id: string) => ["product", id, "reviews"],
  collections: ["collections"],
  collection: (id: string) => ["collection", id],
  auth: {
    me: ["auth", "me"],
  },
};

// --- Product Hooks ---

export const useProducts = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: "price" | "name" | "date";
  sortOrder?: "asc" | "desc";
}) => {
  return useQuery<PaginatedProducts>({
    queryKey: [QUERY_KEYS.products, params],
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
      const data = await get<PaginatedProducts>(url);
      return paginatedProductsSchema.parse(data);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useProduct = (id: string | undefined) => {
  return useQuery<BackendProduct | null>({
    queryKey: QUERY_KEYS.product(id || ""),
    queryFn: async () => {
      if (!id) return null;

      // Direct ID lookup - products now use ID-based routing
      const data = await get<BackendProduct>(endpoints.products.detail(id));
      return productSchema.parse(data);
    },
    enabled: !!id,
    staleTime: 0, // Always consider data stale to ensure fresh fetch
    refetchOnMount: "always", // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2, // Retry failed requests
    retryDelay: 1000, // Wait 1 second between retries
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });
};

export const useProductVariants = (productId: string | undefined) => {
  return useQuery<Variant[]>({
    queryKey: QUERY_KEYS.productVariants(productId || ""),
    queryFn: async () => {
      if (!productId) return [];
      const data = await get<Variant[]>(endpoints.products.variants(productId));
      return Array.isArray(data) ? data.map((v) => variantSchema.parse(v)) : [];
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useProductRecommendations = (productId: string | undefined) => {
  return useQuery<BackendProduct[]>({
    queryKey: ["products", productId, "recommendations"],
    queryFn: async () => {
      if (!productId) return [];
      const data = await get<BackendProduct[]>(
        endpoints.products.recommendations(productId),
      );
      return Array.isArray(data) ? data.map((p) => productSchema.parse(p)) : [];
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });
};

// --- Collection Hooks ---

export const useCollections = () => {
  return useQuery({
    queryKey: QUERY_KEYS.collections,
    queryFn: async () => {
      const data = await get(endpoints.collections.list);
      return Array.isArray(data)
        ? data.map((c) => collectionSchema.parse(c))
        : [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCollection = (id: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.collection(id || ""),
    queryFn: async () => {
      if (!id) return null;
      const data = await get(endpoints.collections.detail(id));
      return collectionSchema.parse(data);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
};

export const useCollectionProducts = (
  collectionId: string | undefined,
  params?: {
    page?: number;
    limit?: number;
  },
) => {
  return useQuery({
    queryKey: ["collections", collectionId, "products", params],
    queryFn: async () => {
      if (!collectionId) return null;
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", params.page.toString());
      if (params?.limit) searchParams.set("limit", params.limit.toString());

      const queryString = searchParams.toString();
      const url = queryString
        ? `${endpoints.collections.products(collectionId)}?${queryString}`
        : endpoints.collections.products(collectionId);
      const data = await get(url);
      return paginatedProductsSchema.parse(data);
    },
    enabled: !!collectionId,
    staleTime: 1000 * 60 * 5,
  });
};

// --- Review Hooks ---

export const useProductReviews = (productId: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.productReviews(productId || ""),
    queryFn: async () => {
      if (!productId)
        return {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        };
      const data = await get(endpoints.products.reviews(productId));
      return paginatedReviewsSchema.parse(data);
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useReviewAggregate = (variantId: string | undefined) => {
  return useQuery<ReviewAggregate | null>({
    queryKey: ["reviewAggregate", variantId],
    queryFn: async () => {
      if (!variantId) return null;
      const data = await get<ReviewAggregate>(
        endpoints.products.reviewAggregate(variantId),
      );
      return reviewAggregateSchema.parse(data);
    },
    enabled: !!variantId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useAddReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      variantId,
      orderId,
      rating,
      title,
      body,
      images,
    }: {
      variantId: string;
      orderId: string;
      rating: number;
      title?: string;
      body: string;
      images?: string[];
    }) => {
      const data = await post(endpoints.products.createReview(variantId), {
        variantId,
        orderId,
        rating,
        title,
        body,
        images,
      });
      return reviewSchema.parse(data);
    },
    onSuccess: (newReview, variables) => {
      // Invalidate product reviews and aggregate
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.productReviews(variables.variantId),
      });
      queryClient.invalidateQueries({
        queryKey: ["reviewAggregate", variables.variantId],
      });
    },
  });
};

// --- Auth Hooks ---

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const validated = loginSchema.parse(credentials);
      const data = await post(endpoints.auth.login, validated);
      const response = authResponseSchema.parse(data);
      setToken(response.access_token);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.me });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const validated = registerSchema.parse(data);
      const response = await post(endpoints.auth.register, validated);
      const authResponse = authResponseSchema.parse(response);
      setToken(authResponse.access_token);
      return authResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.me });
    },
  });
};

export const useAuthMe = () => {
  return useQuery({
    queryKey: QUERY_KEYS.auth.me,
    queryFn: async () => {
      const data = await get(endpoints.auth.me);
      return userProfileSchema.parse(data);
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await post(endpoints.auth.logout, {});
      } catch (error) {
        // Continue with logout even if API call fails
        console.error("Logout API error:", error);
      }
      removeToken();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

// --- Legacy hooks for backward compatibility ---
// These will be removed as we migrate components

export const useReviews = () => {
  // This is a legacy hook - components should use useProductReviews instead
  return useQuery({
    queryKey: QUERY_KEYS.reviews,
    queryFn: async () => {
      // Return empty reviews for now - components should migrate to useProductReviews
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateOrder = () => {
  // Legacy hook - checkout should use checkout flow instead
  return useMutation({
    mutationFn: async (order: unknown) => {
      // This will be replaced with proper checkout flow
      throw new Error(
        "useCreateOrder is deprecated. Use checkout flow instead.",
      );
    },
  });
};
