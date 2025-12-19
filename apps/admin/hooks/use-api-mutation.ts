import { UseMutationOptions, useMutation } from "@tanstack/react-query";
import { FetchError } from "@/lib/api";

/**
 * Custom hook for POST/PUT/PATCH/DELETE requests with React Query
 *
 * @example
 * const mutation = useApiMutation<User, CreateUserDto>({
 *   mutationFn: (data) => api.post('/api/users', data),
 *   onSuccess: () => {
 *     queryClient.invalidateQueries({ queryKey: ['users'] });
 *   },
 * });
 */
export function useApiMutation<
  TData = unknown,
  TVariables = unknown,
  TError = FetchError,
  TContext = unknown,
>(options: UseMutationOptions<TData, TError, TVariables, TContext>) {
  return useMutation<TData, TError, TVariables, TContext>(options);
}
