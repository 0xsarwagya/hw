"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Variant } from "@/lib/types/products";
import { useApiMutation } from "../use-api-mutation";

interface AdjustInventoryInput {
  quantity: number;
  reason?: string;
}

export function useAdminInventoryAdjust(productId: string, variantId: string) {
  const queryClient = useQueryClient();

  return useApiMutation<Variant, AdjustInventoryInput>({
    mutationFn: async (data) => {
      // Update variant inventory directly
      const variant = await api.get<Variant>(
        endpoints.products.variants.detail(productId, variantId),
      );
      const newInventory = variant.inventory + data.quantity;

      return api.put<Variant>(
        endpoints.products.variants.update(productId, variantId),
        {
          inventory: newInventory,
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [endpoints.products.variants.list(productId)],
      });
      queryClient.invalidateQueries({
        queryKey: [endpoints.products.variants.detail(productId, variantId)],
      });
      queryClient.invalidateQueries({
        queryKey: [endpoints.products.detail(productId)],
      });
      toast.success("Inventory adjusted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to adjust inventory");
    },
  });
}
