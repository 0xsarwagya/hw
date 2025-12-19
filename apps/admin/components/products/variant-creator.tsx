"use client";

import { useState } from "react";
import type {
  ProductVariantOptionType,
  VariantOptionValue,
} from "@/lib/types/products";
import { VariantList } from "./variants/variant-list";
import { VariantOptionSelector } from "./variants/variant-option-selector";

interface VariantCreatorProps {
  optionTypes: ProductVariantOptionType[];
  onVariantsChange: (variants: PendingVariant[]) => void;
  defaultPrice?: number;
}

export interface PendingVariant {
  id: string;
  price: number;
  inventory: number;
  sku?: string;
  compareAtPrice?: number;
  optionValueIds: string[];
}

/**
 * Main variant creator component
 * Orchestrates variant creation by combining option selection and variant management
 */
export function VariantCreator({
  optionTypes,
  onVariantsChange,
  defaultPrice = 0,
}: VariantCreatorProps) {
  const [selectedCombinations, setSelectedCombinations] = useState<
    Map<string, Set<string>>
  >(new Map());
  const [variants, setVariants] = useState<PendingVariant[]>([]);

  const handleToggleCombination = (
    optionTypeId: string,
    valueId: string,
    checked: boolean,
  ) => {
    setSelectedCombinations((prev) => {
      const newMap = new Map(prev);
      if (!newMap.has(optionTypeId)) {
        newMap.set(optionTypeId, new Set());
      }
      const valueSet = newMap.get(optionTypeId);
      if (!valueSet) {
        return newMap;
      }
      if (checked) {
        valueSet.add(valueId);
      } else {
        valueSet.delete(valueId);
        if (valueSet.size === 0) {
          newMap.delete(optionTypeId);
        }
      }
      return newMap;
    });
  };

  const handleCreateVariants = () => {
    const selectedValuesByType = Array.from(selectedCombinations.entries()).map(
      ([typeId, valueIds]) => ({
        typeId,
        values: Array.from(valueIds)
          .map((valueId) => {
            const optionType = optionTypes.find((ot) => ot.id === typeId);
            return optionType?.values?.find((v) => v.id === valueId);
          })
          .filter(Boolean) as VariantOptionValue[],
      }),
    );

    const newVariants: PendingVariant[] = [];

    function generateVariantCombos(
      currentCombo: VariantOptionValue[],
      remainingSelections: typeof selectedValuesByType,
    ) {
      if (remainingSelections.length === 0) {
        if (currentCombo.length > 0) {
          newVariants.push({
            id: `temp-${Date.now()}-${Math.random()}`,
            price: defaultPrice,
            inventory: 0,
            optionValueIds: currentCombo.map((v) => v.id),
          });
        }
        return;
      }

      const [currentSelection, ...rest] = remainingSelections;
      if (currentSelection.values.length === 0) {
        generateVariantCombos(currentCombo, rest);
        return;
      }

      for (const value of currentSelection.values) {
        generateVariantCombos([...currentCombo, value], rest);
      }
    }

    generateVariantCombos([], selectedValuesByType);

    setVariants(newVariants);
    onVariantsChange(newVariants);
  };

  const handleUpdateVariant = (
    variantId: string,
    updates: Partial<PendingVariant>,
  ) => {
    const updated = variants.map((v) =>
      v.id === variantId ? { ...v, ...updates } : v,
    );
    setVariants(updated);
    onVariantsChange(updated);
  };

  const handleRemoveVariant = (variantId: string) => {
    const updated = variants.filter((v) => v.id !== variantId);
    setVariants(updated);
    onVariantsChange(updated);
  };

  if (optionTypes.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed rounded-lg">
        <p className="text-sm text-muted-foreground">
          Add variant option types first to create variants.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <VariantOptionSelector
        optionTypes={optionTypes}
        selectedCombinations={selectedCombinations}
        onToggleCombination={handleToggleCombination}
        onCreateVariants={handleCreateVariants}
      />

      <VariantList
        variants={variants}
        optionTypes={optionTypes}
        onUpdate={handleUpdateVariant}
        onRemove={handleRemoveVariant}
      />
    </div>
  );
}
