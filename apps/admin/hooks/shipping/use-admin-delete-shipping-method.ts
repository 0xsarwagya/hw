"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";

export function useAdminDeleteShippingMethod() {
  const queryClient = useQueryClient();

  return useApiMutation<void, string, FetchError>({
    mutationFn: async (id: string) => {
      return api.delete(endpoints.shippingMethods.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.shippingMethods.list],
      });
      toast.success("Shipping method deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete shipping method");
      throw error;
    },
  });
}
