"use client";

import { useMemo } from "react";
import { useAdminVariants } from "../products/use-admin-variants";
import { useAdminBundles } from "./use-admin-bundles";

/**
 * Hook to fetch bundles that contain variants from a specific product
 *
 * @param productId - Product ID to find bundles for
 * @returns Filtered bundles that contain this product's variants
 */
export function useProductBundles(productId: string) {
  const {
    data: bundlesData,
    isLoading,
    error,
  } = useAdminBundles({
    limit: 1000, // Get all bundles to filter client-side
  });
  const { data: variants } = useAdminVariants(productId);

  const productVariantIds = useMemo(
    () => new Set(variants?.map((v) => v.id) || []),
    [variants],
  );

  const bundles = useMemo(() => {
    if (!bundlesData?.data || !variants || variants.length === 0) {
      return [];
    }

    return bundlesData.data.filter((bundle) => {
      // Check if any set in this bundle contains variants from this product
      return bundle.sets?.some((set) =>
        set.items?.some((item) => productVariantIds.has(item.variantId)),
      );
    });
  }, [bundlesData, productVariantIds]);

  // Enrich bundles with information about which sets contain this product
  const enrichedBundles = useMemo(() => {
    return bundles.map((bundle) => {
      const relevantSets =
        bundle.sets
          ?.map((set) => {
            const relevantItems = set.items?.filter((item) =>
              productVariantIds.has(item.variantId),
            );
            return relevantItems && relevantItems.length > 0
              ? { set, itemCount: relevantItems.length }
              : null;
          })
          .filter(
            (s): s is { set: (typeof bundle.sets)[0]; itemCount: number } =>
              s !== null,
          ) || [];

      return {
        ...bundle,
        relevantSets,
      };
    });
  }, [bundles, productVariantIds]);

  return {
    data: enrichedBundles,
    isLoading,
    error,
  };
}
