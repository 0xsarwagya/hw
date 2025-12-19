"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type {
  CustomerGroup,
  UpdateCustomerGroupInput,
} from "@/lib/types/customer-groups";
import { useApiMutation } from "../use-api-mutation";

export function useAdminUpdateCustomerGroup(id: string) {
  const queryClient = useQueryClient();

  return useApiMutation<CustomerGroup, UpdateCustomerGroupInput, FetchError>({
    mutationFn: async (data) => {
      return api.put<CustomerGroup>(endpoints.customerGroups.update(id), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.customerGroups.list],
      });
      queryClient.invalidateQueries({
        queryKey: [endpoints.customerGroups.detail(id)],
      });
      toast.success("Customer group updated successfully");
    },
    onError: (error) => {
      if (error.errors && Object.keys(error.errors).length > 0) {
        const fieldErrors = Object.entries(error.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        toast.error(`Validation errors:\n${fieldErrors}`, { duration: 5000 });
      } else {
        toast.error(error.message || "Failed to update customer group");
      }
      throw error;
    },
  });
}
