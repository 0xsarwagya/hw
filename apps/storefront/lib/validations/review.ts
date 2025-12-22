import { z } from "zod";

/**
 * Review validation schemas matching backend DTOs
 */

export const reviewSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  customerName: z.string(),
  orderId: z.string().uuid(),
  variantId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  title: z.string().nullable().optional(),
  body: z.string(),
  images: z.array(z.string().url()).nullable().optional(),
  status: z.enum(["pending", "approved", "rejected"]),
  helpfulCount: z.number(),
  isHelpful: z.boolean().optional(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export const createReviewSchema = z.object({
  orderId: z.string().uuid(),
  variantId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().min(1).max(2000),
  images: z.array(z.string().url()).max(5).optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
  images: z.array(z.string().url()).max(5).optional(),
});

export const reviewAggregateSchema = z.object({
  variantId: z.string().uuid(),
  averageRating: z.number().min(0).max(5),
  reviewCount: z.number(),
  rating1Count: z.number(),
  rating2Count: z.number(),
  rating3Count: z.number(),
  rating4Count: z.number(),
  rating5Count: z.number(),
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

export type Review = z.infer<typeof reviewSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReviewAggregate = z.infer<typeof reviewAggregateSchema>;
export type PaginatedReviews = z.infer<typeof paginatedReviewsSchema>;
