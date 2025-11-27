import { useQuery } from "@tanstack/react-query";
import { adminApi, QueryOrdersParams } from "@/lib/api";
import { queryKeys } from "./query-keys";

/**
 * Hook to fetch orders with pagination and filters
 */
export function useOrders(params?: QueryOrdersParams) {
  return useQuery({
    queryKey: queryKeys.admin.orders(params),
    queryFn: () => adminApi.getOrders(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.order(id),
    queryFn: () => adminApi.getOrder(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
