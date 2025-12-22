"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type {
  CreateShippingMethodInput,
  ShippingMethod,
} from "@/lib/types/shipping-methods";
import { useApiMutation } from "../use-api-mutation";

export function useAdminCreateShippingMethod() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useApiMutation<ShippingMethod, CreateShippingMethodInput, FetchError>({
    mutationFn: async (data) => {
      return api.post<ShippingMethod>(endpoints.shippingMethods.create, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.shippingMethods.list],
      });
      toast.success("Shipping method created successfully");
      router.push(`/settings/shipping-methods/${data.id}`);
    },
    onError: (error) => {
      if (error.errors && Object.keys(error.errors).length > 0) {
        const fieldErrors = Object.entries(error.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        toast.error(`Validation errors:\n${fieldErrors}`, { duration: 5000 });
      } else {
        toast.error(error.message || "Failed to create shipping method");
      }
      throw error;
    },
  });
}
