"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type {
  InventorySettings,
  UpdateInventorySettingsInput,
} from "@/lib/types/inventory";
import { useApiMutation } from "../use-api-mutation";

/**
 * Hook for updating inventory settings
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * const updateSettings = useUpdateInventorySettings();
 *
 * updateSettings.mutate({
 *   globalLowStockThreshold: 10,
 *   perVariantOverrides: {
 *     "variant-id": 5,
 *   },
 * });
 * ```
 */
export function useUpdateInventorySettings() {
  const queryClient = useQueryClient();

  return useApiMutation<InventorySettings, UpdateInventorySettingsInput>({
    mutationFn: async (data) => {
      return api.post<InventorySettings>(endpoints.inventory.settings, data);
    },
    onSuccess: () => {
      // Invalidate settings query
      queryClient.invalidateQueries({
        queryKey: [endpoints.inventory.settings],
      });
      // Also invalidate list to refresh low stock indicators
      queryClient.invalidateQueries({
        queryKey: [endpoints.inventory.list],
      });

      toast.success("Inventory settings updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update inventory settings");
    },
  });
}
