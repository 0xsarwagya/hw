"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { endpoints, get, post } from "@/lib/api/client";
import {
  orderSchema,
  orderTimelineSchema,
  orderTrackingSchema,
} from "@/lib/validations/order";

/**
 * Get orders list with optional status filter
 */
export function useOrders(status?: string) {
  return useQuery({
    queryKey: ["orders", status],
    queryFn: async () => {
      const url = status
        ? `${endpoints.orders.list}?status=${status}`
        : endpoints.orders.list;
      const data = await get(url);
      return Array.isArray(data) ? data.map((o) => orderSchema.parse(o)) : [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get single order by ID
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      const data = await get(endpoints.orders.detail(id));
      return orderSchema.parse(data);
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Get order tracking information
 */
export function useOrderTracking(id: string) {
  return useQuery({
    queryKey: ["orders", id, "tracking"],
    queryFn: async () => {
      const data = await get(endpoints.orders.tracking(id));
      return orderTrackingSchema.parse(data);
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get order timeline
 */
export function useOrderTimeline(id: string) {
  return useQuery({
    queryKey: ["orders", id, "timeline"],
    queryFn: async () => {
      const data = await get(endpoints.orders.timeline(id));
      return orderTimelineSchema.parse(data);
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Retry payment for an order
 */
export function useRetryPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const data = await post(endpoints.orders.retryPayment(orderId), {});
      return data as {
        paymentIntentId: string;
        redirectUrl: string;
        orderId: string;
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders", data.orderId] });
      toast.success("Payment retry initiated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to retry payment");
    },
  });
}

/**
 * Cancel an order
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
      refundRequested,
    }: {
      orderId: string;
      reason?: string;
      refundRequested?: boolean;
    }) => {
      const data = await post(endpoints.orders.cancel(orderId), {
        reason,
        refundRequested,
      });
      return orderSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", data.id] });
      toast.success("Order cancelled successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel order");
    },
  });
}
