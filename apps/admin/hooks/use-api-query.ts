import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { api, FetchError } from "@/lib/api";

/**
 * Custom hook for GET requests with React Query
 * 
 * @example
 * const { data, isLoading, error } = useApiQuery<User[]>('/api/users');
 */
export function useApiQuery<TData = unknown>(
  endpoint: string,
  options?: Omit<UseQueryOptions<TData, FetchError>, "queryKey" | "queryFn"> & {
    params?: Record<string, string | number | boolean | undefined>;
  }
) {
  const { params, ...queryOptions } = options || {};

  return useQuery<TData, FetchError>({
    queryKey: [endpoint, params],
    queryFn: () => api.get<TData>(endpoint, { params }),
    ...queryOptions,
  });
}

