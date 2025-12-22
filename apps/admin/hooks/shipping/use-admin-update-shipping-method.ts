"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type {
  ShippingMethod,
  UpdateShippingMethodInput,
} from "@/lib/types/shipping-methods";
import { useApiMutation } from "../use-api-mutation";

export function useAdminUpdateShippingMethod(id: string) {
  const queryClient = useQueryClient();

  return useApiMutation<ShippingMethod, UpdateShippingMethodInput, FetchError>({
    mutationFn: async (data) => {
      return api.put<ShippingMethod>(
        endpoints.shippingMethods.update(id),
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.shippingMethods.list],
      });
      queryClient.invalidateQueries({
        queryKey: [endpoints.shippingMethods.detail(id)],
      });
      toast.success("Shipping method updated successfully");
    },
    onError: (error) => {
      if (error.errors && Object.keys(error.errors).length > 0) {
        const fieldErrors = Object.entries(error.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        toast.error(`Validation errors:\n${fieldErrors}`, { duration: 5000 });
      } else {
        toast.error(error.message || "Failed to update shipping method");
      }
      throw error;
    },
  });
}
