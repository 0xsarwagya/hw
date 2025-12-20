"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type {
  BulkAdjustInventoryInput,
  BulkAdjustInventoryResponse,
} from "@/lib/types/inventory";
import { useApiMutation } from "../use-api-mutation";

/**
 * Hook for bulk adjusting inventory for multiple variants
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * const bulkAdjust = useBulkAdjustInventory();
 *
 * bulkAdjust.mutate({
 *   adjustments: [
 *     {
 *       sku: "TSHIRT-BLACK-M",
 *       type: "increase",
 *       quantity: 10,
 *       reason: "received",
 *     },
 *   ],
 * });
 * ```
 */
export function useBulkAdjustInventory() {
  const queryClient = useQueryClient();

  return useApiMutation<BulkAdjustInventoryResponse, BulkAdjustInventoryInput>({
    mutationFn: async (data) => {
      return api.post<BulkAdjustInventoryResponse>(
        endpoints.inventory.bulkAdjust,
        data,
      );
    },
    onSuccess: (data) => {
      // Invalidate all inventory-related queries
      queryClient.invalidateQueries({
        queryKey: [endpoints.inventory.list],
      });
      queryClient.invalidateQueries({
        queryKey: [endpoints.inventory.health],
      });

      // Show success toast with summary
      toast.success(
        `Bulk adjustment completed: ${data.successful} successful, ${data.failed} failed`,
      );
    },
    onError: (error) => {
      toast.error(error.message || "Failed to bulk adjust inventory");
    },
  });
}
