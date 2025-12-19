"use client";

import { endpoints } from "@/lib/endpoints";
import type { Review } from "@/lib/types/reviews";
import { useApiQuery } from "../use-api-query";

export interface PendingReviewsResponse {
  data: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useAdminPendingReviews(page?: number, limit?: number) {
  return useApiQuery<PendingReviewsResponse>(endpoints.reviews.pending, {
    params: {
      page: page || 1,
      limit: limit || 20,
    },
    enabled: true,
  });
}
