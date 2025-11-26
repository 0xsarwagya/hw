import { useQuery } from "@tanstack/react-query";
import { adminApi, Product } from "@/lib/api";
import { queryKeys } from "./query-keys";

export function useProduct(id: string) {
  return useQuery<Product, Error>({
    queryKey: queryKeys.admin.product(id),
    queryFn: () => adminApi.getProduct(id),
    enabled: !!id,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}
