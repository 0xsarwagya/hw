"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { WIZARD_MESSAGES } from "@/lib/constants/wizard.constants";
import { endpoints } from "@/lib/endpoints";

interface PendingVariant {
  id: string;
  price: number;
  inventory?: number;
  sku?: string;
  compareAtPrice?: number | null;
  optionValueIds?: string[];
}

/**
 * Hook for handling product variant creation
 * Manages default variant and multiple variants creation
 */
export function useProductVariantCreation() {
  const createDefaultVariant = useCallback(
    async (productId: string, price: number) => {
      try {
        await api.post(endpoints.products.variants.create(productId), {
          productId,
          price,
          inventory: 0,
        });
        toast.success(WIZARD_MESSAGES.DEFAULT_VARIANT_SUCCESS);
      } catch (_error) {
        toast.error(WIZARD_MESSAGES.DEFAULT_VARIANT_ERROR);
      }
    },
    [],
  );

  const createVariants = useCallback(
    async (productId: string, variants: PendingVariant[]) => {
      if (variants.length === 0) return;

      try {
        for (const variant of variants) {
          const { id: _id, ...variantData } = variant;
          await api.post(endpoints.products.variants.create(productId), {
            productId,
            ...variantData,
          });
        }
        toast.success(WIZARD_MESSAGES.VARIANTS_CREATE_SUCCESS(variants.length));
      } catch (_error) {
        toast.error(WIZARD_MESSAGES.VARIANTS_CREATE_ERROR);
      }
    },
    [],
  );

  return { createDefaultVariant, createVariants };
}
