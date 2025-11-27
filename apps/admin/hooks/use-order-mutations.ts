import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, OrderStatus } from "@/lib/api";
import { queryKeys } from "./query-keys";

/**
 * Hook for order mutations
 */
export function useOrderMutations() {
  const queryClient = useQueryClient();

  /**
   * Update order status mutation
   */
  const updateOrderStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      adminApi.updateOrderStatus(id, status),
    onSuccess: (_, { id }) => {
      // Invalidate all order-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.order(id) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.recentOrders(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats });
    },
  });

  return {
    updateOrderStatus,
  };
}
