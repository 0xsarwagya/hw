"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import type { ProductVariantOptionType, VariantOptionValue } from "@/lib/types/products";

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

export function VariantCreator({
  optionTypes,
  onVariantsChange,
  defaultPrice = 0,
}: VariantCreatorProps) {
  const [selectedCombinations, setSelectedCombinations] = useState<
    Map<string, Set<string>>
  >(new Map());
  const [variants, setVariants] = useState<PendingVariant[]>([]);

  // Generate all possible combinations
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
        // Skip option types without values
        generateCombos(currentCombo, rest);
        return;
      }

      // Include each value from current type
      for (const value of values) {
        generateCombos([...currentCombo, value], rest);
      }

      // Also include option to skip this type
      generateCombos(currentCombo, rest);
    }

    generateCombos([], optionTypes);
    return combinations;
  }, [optionTypes]);

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
      const valueSet = newMap.get(optionTypeId)!;
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
    // Build combinations from selected values
    const selectedValuesByType = Array.from(selectedCombinations.entries()).map(
      ([typeId, valueIds]) => ({
        typeId,
        values: Array.from(valueIds).map((valueId) => {
          const optionType = optionTypes.find((ot) => ot.id === typeId);
          return optionType?.values?.find((v) => v.id === valueId);
        }).filter(Boolean) as VariantOptionValue[],
      }),
    );

    // Generate all combinations
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

  const handleUpdateVariant = (variantId: string, updates: Partial<PendingVariant>) => {
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
      {/* Option Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Option Values</CardTitle>
          <CardDescription>
            Select the values for each option type to create variants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {optionTypes.map((optionType) => {
            const selectedValues = selectedCombinations.get(optionType.id) || new Set();
            const values = optionType.values || [];

            if (values.length === 0) {
              return (
                <div key={optionType.id} className="space-y-2">
                  <Label>{optionType.name}</Label>
                  <p className="text-sm text-muted-foreground">
                    No values available. Add values to this option type first.
                  </p>
                </div>
              );
            }

            return (
              <div key={optionType.id} className="space-y-2">
                <Label>{optionType.name}</Label>
                <div className="flex flex-wrap gap-2">
                  {values.map((value) => (
                    <div key={value.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${optionType.id}-${value.id}`}
                        checked={selectedValues.has(value.id)}
                        onCheckedChange={(checked) =>
                          handleToggleCombination(
                            optionType.id,
                            value.id,
                            checked === true,
                          )
                        }
                      />
                      <Label
                        htmlFor={`${optionType.id}-${value.id}`}
                        className="cursor-pointer text-sm font-normal"
                      >
                        {value.value}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            onClick={handleCreateVariants}
            disabled={
              Array.from(selectedCombinations.values()).every(
                (set) => set.size === 0,
              ) || optionTypes.some((ot) => (ot.values?.length || 0) === 0)
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Variants
          </Button>
        </CardContent>
      </Card>

      {/* Created Variants */}
      {variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Created Variants</CardTitle>
            <CardDescription>
              {variants.length} variant(s) created. Configure pricing and inventory.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {variants.map((variant, index) => {
              const optionValues = variant.optionValueIds
                .map((valueId) => {
                  for (const optionType of optionTypes) {
                    const value = optionType.values?.find((v) => v.id === valueId);
                    if (value) {
                      return { optionType: optionType.name, value: value.value };
                    }
                  }
                  return null;
                })
                .filter(Boolean) as Array<{ optionType: string; value: string }>;

              return (
                <Card key={variant.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm">
                          Variant {index + 1}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {optionValues
                            .map((ov) => `${ov.optionType}: ${ov.value}`)
                            .join(", ")}
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveVariant(variant.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`sku-${variant.id}`}>SKU</Label>
                        <Input
                          id={`sku-${variant.id}`}
                          placeholder="Auto-generated if empty"
                          value={variant.sku || ""}
                          onChange={(e) =>
                            handleUpdateVariant(variant.id, {
                              sku: e.target.value || undefined,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`price-${variant.id}`}>
                          Price (INR) *
                        </Label>
                        <Input
                          id={`price-${variant.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.price || ""}
                          onChange={(e) =>
                            handleUpdateVariant(variant.id, {
                              price: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`inventory-${variant.id}`}>
                          Inventory *
                        </Label>
                        <Input
                          id={`inventory-${variant.id}`}
                          type="number"
                          min="0"
                          value={variant.inventory ?? 0}
                          onChange={(e) =>
                            handleUpdateVariant(variant.id, {
                              inventory: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`compareAtPrice-${variant.id}`}>
                          Compare At Price
                        </Label>
                        <Input
                          id={`compareAtPrice-${variant.id}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.compareAtPrice || ""}
                          onChange={(e) =>
                            handleUpdateVariant(variant.id, {
                              compareAtPrice: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

