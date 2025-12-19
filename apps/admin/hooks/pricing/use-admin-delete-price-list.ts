"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";

export function useAdminDeletePriceList() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useApiMutation<{ message: string }, string, FetchError>({
    mutationFn: async (priceListId: string) => {
      return api.delete<{ message: string }>(
        endpoints.priceLists.delete(priceListId),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.priceLists.list] });
      queryClient.invalidateQueries({
        queryKey: [endpoints.priceLists.active],
      });
      toast.success("Price list deleted successfully");
      router.push("/price-lists");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete price list");
      throw error;
    },
  });
}
