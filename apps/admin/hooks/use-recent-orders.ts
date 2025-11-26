import { useQuery } from "@tanstack/react-query";
import { adminApi, PaginatedOrdersResponse } from "@/lib/api";
import { queryKeys } from "./query-keys";

export function useRecentOrders(limit = 5) {
  return useQuery<PaginatedOrdersResponse, Error>({
    queryKey: queryKeys.admin.recentOrders(limit),
    queryFn: () => adminApi.getRecentOrders(limit),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}
