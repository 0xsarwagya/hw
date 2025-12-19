"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, type FetchError } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { AssignPriceListToGroupInput } from "@/lib/types/customer-groups";
import { useApiMutation } from "../use-api-mutation";

export function useAdminAssignPriceList(groupId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<void, AssignPriceListToGroupInput, FetchError>({
    mutationFn: async (data) => {
      return api.post<void>(
        endpoints.customerGroups.assignPriceList(groupId),
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.customerGroups.detail(groupId)],
      });
      toast.success("Price list assigned successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to assign price list");
      throw error;
    },
  });
}
