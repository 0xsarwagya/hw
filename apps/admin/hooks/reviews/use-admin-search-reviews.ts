"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { Review, ReviewQueryParams } from "@/lib/types/reviews";

export interface SearchReviewsResponse {
  data: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useAdminSearchReviews(params?: ReviewQueryParams) {
  return useApiQuery<SearchReviewsResponse>(endpoints.reviews.search, {
    params: params as Record<string, string | number | boolean | undefined>,
    enabled: true,
  });
}

