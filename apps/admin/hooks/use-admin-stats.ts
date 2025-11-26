import { useQuery } from "@tanstack/react-query";
import { AdminStats, adminApi } from "@/lib/api";
import { queryKeys } from "./query-keys";

export function useAdminStats() {
  return useQuery<AdminStats, Error>({
    queryKey: queryKeys.admin.stats,
    queryFn: () => adminApi.getStats(),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}
