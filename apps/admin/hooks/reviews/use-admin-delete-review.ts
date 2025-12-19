"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toast } from "sonner";

export function useAdminDeleteReview() {
  const queryClient = useQueryClient();

  return useApiMutation<void, string, FetchError>({
    mutationFn: async (reviewId: string) => {
      return api.delete<void>(endpoints.reviews.delete(reviewId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.reviews.pending] });
      queryClient.invalidateQueries({ queryKey: [endpoints.reviews.search] });
      toast.success("Review deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete review");
      throw error;
    },
  });
}

