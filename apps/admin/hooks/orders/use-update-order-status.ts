"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "../use-api-mutation";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toast } from "sonner";
import type { Order, OrderStatus } from "@/lib/types/orders";

interface UpdateOrderStatusParams {
  orderId: string;
  status: OrderStatus;
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useApiMutation<Order, UpdateOrderStatusParams>({
    mutationFn: async ({ orderId, status }) => {
      // Use API route proxy for cookie handling
      return api.patch<Order>(endpoints.orders.detail(orderId), { status });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [endpoints.orders.list] });
      queryClient.invalidateQueries({ queryKey: [endpoints.orders.detail(data.id)] });
      queryClient.invalidateQueries({ queryKey: [endpoints.orders.timeline(data.id)] });
      toast.success(`Order status updated to ${data.status}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update order status");
    },
  });
}

