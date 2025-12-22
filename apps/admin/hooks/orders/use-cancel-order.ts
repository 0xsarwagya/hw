"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Order } from "@/lib/types/orders";
import { useApiMutation } from "../use-api-mutation";

interface CancelOrderDto {
  reason?: string;
  refundRequested?: boolean;
}

interface CancelOrderParams {
  orderId: string;
  cancelDto: CancelOrderDto;
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useApiMutation<Order, CancelOrderParams>({
    mutationFn: async ({ orderId, cancelDto }) => {
      return api.post<Order>(`/admin/orders/${orderId}/cancel`, cancelDto);
    },
    onSuccess: (data) => {
      // Invalidate orders list and order detail queries
      queryClient.invalidateQueries({ queryKey: [endpoints.orders.list] });
      queryClient.invalidateQueries({
        queryKey: [endpoints.orders.detail(data.id)],
      });
      queryClient.invalidateQueries({
        queryKey: [endpoints.orders.timeline(data.id)],
      });
      toast.success(`Order ${data.orderNumber} cancelled successfully`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel order");
    },
  });
}
