"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ProductVariantOptionType } from "@/lib/types/products";

interface VariantOptionSelectorProps {
  optionTypes: ProductVariantOptionType[];
  selectedCombinations: Map<string, Set<string>>;
  onToggleCombination: (
    optionTypeId: string,
    valueId: string,
    checked: boolean,
  ) => void;
  onCreateVariants: () => void;
}

/**
 * Component for selecting variant option values
 */
export function VariantOptionSelector({
  optionTypes,
  selectedCombinations,
  onToggleCombination,
  onCreateVariants,
}: VariantOptionSelectorProps) {
  const canCreateVariants =
    !Array.from(selectedCombinations.values()).every((set) => set.size === 0) &&
    !optionTypes.some((ot) => (ot.values?.length || 0) === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Select Option Values</CardTitle>
        <CardDescription>
          Select the values for each option type to create variants
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {optionTypes.map((optionType) => {
          const selectedValues =
            selectedCombinations.get(optionType.id) || new Set();
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
                        onToggleCombination(
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
          onClick={onCreateVariants}
          disabled={!canCreateVariants}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Variants
        </Button>
      </CardContent>
    </Card>
  );
}
