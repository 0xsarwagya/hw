import { z } from "zod";

/**
 * Product validation schemas matching backend DTOs
 */

export const pricelistPriceSchema = z.object({
  priceListId: z.string().uuid(),
  priceListName: z.string(),
  price: z.number(),
  overrideType: z.string(),
  overrideValue: z.number(),
});

export const productSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  gstRate: z.number(),
  pricingType: z.enum(["inclusive", "exclusive"]),
  gstAmount: z.number(),
  priceExcludingGst: z.number(),
  priceIncludingGst: z.number(),
  hsnCode: z.string().nullable(),
  status: z.enum(["draft", "active", "archived"]),
  categoryId: z.string().uuid().nullable(),
  images: z.array(z.string()).nullable().optional(),
  pricelistPrices: z.array(pricelistPriceSchema).nullable().optional(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export const paginatedProductsSchema = z.object({
  data: z.array(productSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const variantSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  sku: z.string().nullable(),
  price: z.number(),
  compareAtPrice: z.number().nullable(),
  currency: z.string().default("INR"),
  salePrice: z.number().nullable(),
  saleStartDate: z.string().datetime().or(z.date()).nullable(),
  saleEndDate: z.string().datetime().or(z.date()).nullable(),
  inventory: z.number(),
  size: z.string().nullable(),
  color: z.string().nullable(),
  weight: z.number().nullable(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export const reviewSchema = z.object({
  id: z.string().uuid(),
  variantId: z.string().uuid(),
  customerId: z.string().uuid().nullable(),
  rating: z.number().min(1).max(5),
  title: z.string().nullable(),
  comment: z.string().nullable(),
  verifiedPurchase: z.boolean(),
  helpfulCount: z.number(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export const paginatedReviewsSchema = z.object({
  data: z.array(reviewSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const reviewAggregateSchema = z.object({
  variantId: z.string().uuid(),
  averageRating: z.number().min(0).max(5),
  reviewCount: z.number().min(0),
  rating1Count: z.number().min(0),
  rating2Count: z.number().min(0),
  rating3Count: z.number().min(0),
  rating4Count: z.number().min(0),
  rating5Count: z.number().min(0),
  updatedAt: z.string().datetime().or(z.date()),
});

export type Product = z.infer<typeof productSchema>;
export type PaginatedProducts = z.infer<typeof paginatedProductsSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type PaginatedReviews = z.infer<typeof paginatedReviewsSchema>;
export type ReviewAggregate = z.infer<typeof reviewAggregateSchema>;
