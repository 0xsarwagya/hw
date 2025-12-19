"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApiMutation } from "../use-api-mutation";

export function useAdminDeleteCustomerGroup(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useApiMutation<void, void, FetchError>({
    mutationFn: async () => {
      return api.delete<void>(endpoints.customerGroups.delete(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.customerGroups.list],
      });
      toast.success("Customer group deleted successfully");
      router.push("/customer-groups");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete customer group");
      throw error;
    },
  });
}
