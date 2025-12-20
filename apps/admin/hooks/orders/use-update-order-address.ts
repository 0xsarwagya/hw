"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Address, Order } from "@/lib/types/orders";
import { useApiMutation } from "../use-api-mutation";

interface UpdateOrderAddressParams {
  orderId: string;
  addressType: "shipping" | "billing";
  address: Partial<Address>;
}

export function useUpdateOrderAddress() {
  const queryClient = useQueryClient();

  return useApiMutation<Order, UpdateOrderAddressParams>({
    mutationFn: async ({ orderId, addressType, address }) => {
      const url = `/api/orders/${orderId}/addresses`;
      return api.patch<Order>(url, {
        addressType,
        address,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [endpoints.orders.list] });
      queryClient.invalidateQueries({
        queryKey: [endpoints.orders.detail(data.id)],
      });
      toast.success("Address updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update address");
    },
  });
}
