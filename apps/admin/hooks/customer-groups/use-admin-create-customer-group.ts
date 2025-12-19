"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type {
  CreateCustomerGroupInput,
  CustomerGroup,
} from "@/lib/types/customer-groups";
import { useApiMutation } from "../use-api-mutation";

export function useAdminCreateCustomerGroup() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useApiMutation<CustomerGroup, CreateCustomerGroupInput, FetchError>({
    mutationFn: async (data) => {
      return api.post<CustomerGroup>(endpoints.customerGroups.create, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.customerGroups.list],
      });
      toast.success("Customer group created successfully");
      router.push(`/customer-groups/${data.id}`);
    },
    onError: (error) => {
      if (error.errors && Object.keys(error.errors).length > 0) {
        const fieldErrors = Object.entries(error.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        toast.error(`Validation errors:\n${fieldErrors}`, { duration: 5000 });
      } else {
        toast.error(error.message || "Failed to create customer group");
      }
      throw error;
    },
  });
}
