"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Review } from "@/lib/types/reviews";
import { useApiMutation } from "../use-api-mutation";

export function useAdminApproveReview() {
  const queryClient = useQueryClient();

  return useApiMutation<Review, string, FetchError>({
    mutationFn: async (reviewId: string) => {
      return api.post<Review>(endpoints.reviews.approve(reviewId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.reviews.pending] });
      queryClient.invalidateQueries({ queryKey: [endpoints.reviews.search] });
      toast.success("Review approved successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve review");
      throw error;
    },
  });
}
