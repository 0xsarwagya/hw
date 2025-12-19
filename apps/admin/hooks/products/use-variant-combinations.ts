/**
 * Hook for generating variant combinations
 * Extracted logic for variant combination generation
 */

import { useMemo } from "react";
import type {
  ProductVariantOptionType,
  VariantOptionValue,
} from "@/lib/types/products";

export function useVariantCombinations(
  optionTypes: ProductVariantOptionType[],
) {
  const allCombinations = useMemo(() => {
    if (optionTypes.length === 0) return [];

    const combinations: VariantOptionValue[][] = [];

    function generateCombos(
      currentCombo: VariantOptionValue[],
      remainingTypes: ProductVariantOptionType[],
    ) {
      if (remainingTypes.length === 0) {
        if (currentCombo.length > 0) {
          combinations.push([...currentCombo]);
        }
        return;
      }

      const [currentType, ...rest] = remainingTypes;
      const values = currentType.values || [];

      if (values.length === 0) {
        generateCombos(currentCombo, rest);
        return;
      }

      for (const value of values) {
        generateCombos([...currentCombo, value], rest);
      }

      generateCombos(currentCombo, rest);
    }

    generateCombos([], optionTypes);
    return combinations;
  }, [optionTypes]);

  return { allCombinations };
}
