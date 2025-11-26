import { useQuery } from "@tanstack/react-query";
import {
  adminApi,
  PaginatedProductsResponse,
  QueryProductsParams,
} from "@/lib/api";
import { queryKeys } from "./query-keys";

export function useProducts(params?: QueryProductsParams) {
  return useQuery<PaginatedProductsResponse, Error>({
    queryKey: queryKeys.admin.products(params),
    queryFn: () => adminApi.getProducts(params),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}
