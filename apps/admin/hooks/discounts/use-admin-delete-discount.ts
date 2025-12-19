"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useApiMutation } from "../use-api-mutation";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toast } from "sonner";

export function useAdminDeleteDiscount() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useApiMutation<{ message: string }, string, FetchError>({
    mutationFn: async (discountId: string) => {
      return api.delete<{ message: string }>(endpoints.discounts.delete(discountId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.discounts.list] });
      toast.success("Discount deleted successfully");
      router.push("/discounts");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete discount");
      throw error;
    },
  });
}

