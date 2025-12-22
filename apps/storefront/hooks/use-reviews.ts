"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { del, endpoints, get, patch, post } from "@/lib/api/client";
import {
  type CreateReviewInput,
  reviewAggregateSchema,
  reviewSchema,
  type UpdateReviewInput,
} from "@/lib/validations/review";

/**
 * Get review aggregate statistics for a variant
 */
export function useReviewAggregate(variantId: string) {
  return useQuery({
    queryKey: ["reviews", variantId, "aggregate"],
    queryFn: async () => {
      const data = await get(endpoints.products.reviewAggregate(variantId));
      return reviewAggregateSchema.parse(data);
    },
    enabled: !!variantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create a review
 */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      variantId,
      input,
    }: {
      variantId: string;
      input: CreateReviewInput;
    }) => {
      const data = await post(
        endpoints.products.createReview(variantId),
        input,
      );
      return reviewSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", data.variantId],
      });
      queryClient.invalidateQueries({
        queryKey: ["reviews", data.variantId, "aggregate"],
      });
      queryClient.invalidateQueries({
        queryKey: ["products", data.variantId, "reviews"],
      });
      toast.success("Review submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit review");
    },
  });
}

/**
 * Update a review
 */
export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      input,
    }: {
      reviewId: string;
      input: UpdateReviewInput;
    }) => {
      const data = await patch(
        endpoints.products.updateReview(reviewId),
        input,
      );
      return reviewSchema.parse(data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", data.variantId],
      });
      queryClient.invalidateQueries({
        queryKey: ["reviews", data.variantId, "aggregate"],
      });
      queryClient.invalidateQueries({
        queryKey: ["reviews", variables.reviewId],
      });
      toast.success("Review updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update review");
    },
  });
}

/**
 * Delete a review
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      await del(endpoints.products.deleteReview(reviewId));
    },
    onSuccess: (_, _reviewId) => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete review");
    },
  });
}

/**
 * Mark review as helpful
 */
export function useMarkReviewHelpful() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const data = await post(
        endpoints.products.markReviewHelpful(reviewId),
        {},
      );
      return data as { helpful: boolean };
    },
    onSuccess: (_, _reviewId) => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark review as helpful");
    },
  });
}

/**
 * Remove helpful vote from review
 */
export function useRemoveReviewHelpful() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      await del(endpoints.products.removeReviewHelpful(reviewId));
    },
    onSuccess: (_, _reviewId) => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove helpful vote");
    },
  });
}
