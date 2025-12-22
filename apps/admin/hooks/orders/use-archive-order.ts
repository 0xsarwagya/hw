"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Order } from "@/lib/types/orders";
import { useApiMutation } from "../use-api-mutation";

export function useArchiveOrder() {
  const queryClient = useQueryClient();

  return useApiMutation<Order, string>({
    mutationFn: async (orderId) => {
      return api.post<Order>(`/admin/orders/${orderId}/archive`);
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
      toast.success(`Order ${data.orderNumber} archived successfully`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to archive order");
    },
  });
}

export function useUnarchiveOrder() {
  const queryClient = useQueryClient();

  return useApiMutation<Order, string>({
    mutationFn: async (orderId) => {
      return api.post<Order>(`/admin/orders/${orderId}/unarchive`);
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
      toast.success(`Order ${data.orderNumber} unarchived successfully`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unarchive order");
    },
  });
}
