"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useApiMutation } from "../use-api-mutation";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { PriceList, CreatePriceListInput } from "@/lib/types/price-lists";
import { toast } from "sonner";

export function useAdminCreatePriceList() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useApiMutation<PriceList, CreatePriceListInput, FetchError>({
    mutationFn: async (data) => {
      return api.post<PriceList>(endpoints.priceLists.create, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [endpoints.priceLists.list] });
      queryClient.invalidateQueries({ queryKey: [endpoints.priceLists.active] });
      toast.success("Price list created successfully");
      router.push(`/price-lists/${data.id}`);
    },
    onError: (error) => {
      if (error.errors && Object.keys(error.errors).length > 0) {
        const fieldErrors = Object.entries(error.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        toast.error(`Validation errors:\n${fieldErrors}`, { duration: 5000 });
      } else {
        toast.error(error.message || "Failed to create price list");
      }
      throw error;
    },
  });
}

