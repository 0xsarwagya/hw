"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Review } from "@/lib/types/reviews";
import { toast } from "sonner";

export function useAdminRejectReview() {
  const queryClient = useQueryClient();

  return useApiMutation<Review, string, FetchError>({
    mutationFn: async (reviewId: string) => {
      return api.post<Review>(endpoints.reviews.reject(reviewId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.reviews.pending] });
      queryClient.invalidateQueries({ queryKey: [endpoints.reviews.search] });
      toast.success("Review rejected successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject review");
      throw error;
    },
  });
}

