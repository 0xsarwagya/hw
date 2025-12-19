"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FIELD_LABELS, PLACEHOLDERS } from "@/lib/constants/forms.constants";
import type { ProductVariantOptionType } from "@/lib/types/products";
import type { PendingVariant } from "../variant-creator";

interface VariantFormProps {
  variant: PendingVariant;
  index: number;
  optionTypes: ProductVariantOptionType[];
  onUpdate: (variantId: string, updates: Partial<PendingVariant>) => void;
  onRemove: (variantId: string) => void;
}

/**
 * Form component for editing a single variant
 */
export function VariantForm({
  variant,
  index,
  optionTypes,
  onUpdate,
  onRemove,
}: VariantFormProps) {
  const optionValues = variant.optionValueIds
    .map((valueId) => {
      for (const optionType of optionTypes) {
        const value = optionType.values?.find((v) => v.id === valueId);
        if (value) {
          return {
            optionType: optionType.name,
            value: value.value,
          };
        }
      }
      return null;
    })
    .filter(Boolean) as Array<{
    optionType: string;
    value: string;
  }>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Variant {index + 1}</CardTitle>
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
            onClick={() => onRemove(variant.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`sku-${variant.id}`}>{FIELD_LABELS.SKU}</Label>
            <Input
              id={`sku-${variant.id}`}
              placeholder={PLACEHOLDERS.SKU_AUTO_GENERATED}
              value={variant.sku || ""}
              onChange={(e) =>
                onUpdate(variant.id, {
                  sku: e.target.value || undefined,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`price-${variant.id}`}>
              {FIELD_LABELS.BASE_PRICE} *
            </Label>
            <Input
              id={`price-${variant.id}`}
              type="number"
              step="0.01"
              min="0"
              value={variant.price || ""}
              onChange={(e) =>
                onUpdate(variant.id, {
                  price: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`inventory-${variant.id}`}>
              {FIELD_LABELS.INVENTORY} *
            </Label>
            <Input
              id={`inventory-${variant.id}`}
              type="number"
              min="0"
              value={variant.inventory ?? 0}
              onChange={(e) =>
                onUpdate(variant.id, {
                  inventory: parseInt(e.target.value, 10) || 0,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`compareAtPrice-${variant.id}`}>
              {FIELD_LABELS.COMPARE_AT_PRICE}
            </Label>
            <Input
              id={`compareAtPrice-${variant.id}`}
              type="number"
              step="0.01"
              min="0"
              value={variant.compareAtPrice || ""}
              onChange={(e) =>
                onUpdate(variant.id, {
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
}
