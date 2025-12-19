"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";

export function useAdminDeletePriceList(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useApiMutation<void, void, FetchError>({
    mutationFn: async () => {
      return api.delete<void>(endpoints.priceLists.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoints.priceLists.list] });
      toast.success("Price list deleted successfully");
      router.push("/price-lists");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete price list");
      throw error;
    },
  });
}
