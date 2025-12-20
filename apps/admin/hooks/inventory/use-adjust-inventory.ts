"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type {
  AdjustInventoryInput,
  InventoryAdjustment,
} from "@/lib/types/inventory";
import { useApiMutation } from "../use-api-mutation";

/**
 * Hook for adjusting inventory for a single variant
 *
 * @param variantId - Variant ID to adjust inventory for
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * const adjustInventory = useAdjustInventory(variantId);
 *
 * adjustInventory.mutate({
 *   type: "increase",
 *   quantity: 10,
 *   reason: "received",
 *   note: "New stock received",
 * });
 * ```
 */
export function useAdjustInventory(variantId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<InventoryAdjustment, AdjustInventoryInput>({
    mutationFn: async (data) => {
      return api.post<InventoryAdjustment>(
        endpoints.inventory.adjust(variantId),
        data,
      );
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: [endpoints.inventory.list],
      });
      queryClient.invalidateQueries({
        queryKey: [endpoints.inventory.detail(variantId)],
      });
      queryClient.invalidateQueries({
        queryKey: [endpoints.inventory.logs(variantId)],
      });
      queryClient.invalidateQueries({
        queryKey: [endpoints.inventory.health],
      });

      // Show success toast
      const deltaText = data.delta > 0 ? `+${data.delta}` : `${data.delta}`;
      toast.success(`Inventory adjusted (${deltaText})`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to adjust inventory");
    },
  });
}
