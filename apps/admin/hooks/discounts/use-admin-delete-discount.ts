"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";

export function useAdminDeleteDiscount(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useApiMutation<void, void, FetchError>({
    mutationFn: async () => {
      return api.delete<void>(endpoints.discounts.delete(id));
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
