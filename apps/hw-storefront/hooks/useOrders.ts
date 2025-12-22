import { useQuery } from "@tanstack/react-query";
import { endpoints, get } from "../lib/api/client";
import {
  type Order,
  type OrderTimeline,
  type OrderTracking,
  orderSchema,
  orderTimelineSchema,
  orderTrackingSchema,
} from "../lib/validations/order";

export const QUERY_KEYS = {
  orders: ["orders"],
  order: (id: string) => ["orders", id],
  orderTimeline: (id: string) => ["orders", id, "timeline"],
  orderTracking: (id: string) => ["orders", id, "tracking"],
};

export const useOrders = (status?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.orders, status],
    queryFn: async () => {
      const url = status
        ? `${endpoints.orders.list}?status=${status}`
        : endpoints.orders.list;
      const data = await get(url);
      return Array.isArray(data) ? data.map((o) => orderSchema.parse(o)) : [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useOrder = (
  id: string,
  options?: { enabled?: boolean; retry?: number; retryDelay?: number },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.order(id),
    queryFn: async () => {
      const data = await get(endpoints.orders.detail(id));
      return orderSchema.parse(data);
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!id,
    retry: options?.retry !== undefined ? options.retry : 3,
    retryDelay: options?.retryDelay !== undefined ? options.retryDelay : 1000,
    staleTime: 2 * 60 * 1000,
  });
};

export const useOrderTimeline = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.orderTimeline(id),
    queryFn: async () => {
      const data = await get(endpoints.orders.timeline(id));
      return orderTimelineSchema.parse(data);
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useOrderTracking = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.orderTracking(id),
    queryFn: async () => {
      const data = await get(endpoints.orders.tracking(id));
      return orderTrackingSchema.parse(data);
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
