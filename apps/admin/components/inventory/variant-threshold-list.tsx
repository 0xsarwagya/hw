"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVariantsIndex } from "@/hooks/inventory/use-variants-index";

interface VariantThresholdListProps {
  overrides: Record<string, number>;
  onOverridesChange: (overrides: Record<string, number>) => void;
}

/**
 * Component for managing per-variant low stock threshold overrides
 */
export function VariantThresholdList({
  overrides,
  onOverridesChange,
}: VariantThresholdListProps) {
  const { data: variantsIndex } = useVariantsIndex();
  const [newVariantId, setNewVariantId] = useState<string>("");
  const [newThreshold, setNewThreshold] = useState<number>(5);

  const addOverride = () => {
    if (!newVariantId) return;
    onOverridesChange({
      ...overrides,
      [newVariantId]: newThreshold,
    });
    setNewVariantId("");
    setNewThreshold(5);
  };

  const removeOverride = (variantId: string) => {
    const newOverrides = { ...overrides };
    delete newOverrides[variantId];
    onOverridesChange(newOverrides);
  };

  const updateOverride = (variantId: string, threshold: number) => {
    onOverridesChange({
      ...overrides,
      [variantId]: threshold,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Per-Variant Overrides</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Set custom low stock thresholds for specific variants
        </p>
      </div>

      <div className="flex gap-2">
        <Select value={newVariantId} onValueChange={setNewVariantId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select variant" />
          </SelectTrigger>
          <SelectContent>
            {variantsIndex?.variants
              .filter((v) => !overrides[v.variantId])
              .map((variant) => (
                <SelectItem key={variant.variantId} value={variant.variantId}>
                  {variant.sku} - {variant.productTitle}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          value={newThreshold}
          onChange={(e) => setNewThreshold(parseInt(e.target.value, 10) || 0)}
          placeholder="Threshold"
          className="w-32"
          min={0}
        />
        <Button type="button" variant="outline" onClick={addOverride}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {Object.keys(overrides).length > 0 && (
        <div className="space-y-2">
          {Object.entries(overrides).map(([variantId, threshold]) => {
            const variant = variantsIndex?.variants.find(
              (v) => v.variantId === variantId,
            );
            return (
              <div
                key={variantId}
                className="flex items-center gap-2 rounded-lg border p-3"
              >
                <div className="flex-1">
                  <div className="font-mono text-sm font-medium">
                    {variant?.sku || variantId.slice(0, 8)}
                  </div>
                  {variant && (
                    <div className="text-xs text-muted-foreground">
                      {variant.productTitle}
                    </div>
                  )}
                </div>
                <Input
                  type="number"
                  value={threshold}
                  onChange={(e) =>
                    updateOverride(variantId, parseInt(e.target.value, 10) || 0)
                  }
                  className="w-24"
                  min={0}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOverride(variantId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
