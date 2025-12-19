"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProductVariantOptionType } from "@/lib/types/products";
import type { PendingVariant } from "../variant-creator";
import { VariantForm } from "./variant-form";

interface VariantListProps {
  variants: PendingVariant[];
  optionTypes: ProductVariantOptionType[];
  onUpdate: (variantId: string, updates: Partial<PendingVariant>) => void;
  onRemove: (variantId: string) => void;
}

/**
 * Component for displaying and managing a list of created variants
 */
export function VariantList({
  variants,
  optionTypes,
  onUpdate,
  onRemove,
}: VariantListProps) {
  if (variants.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Created Variants</CardTitle>
        <CardDescription>
          {variants.length} variant(s) created. Configure pricing and inventory.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {variants.map((variant, index) => (
          <VariantForm
            key={variant.id}
            variant={variant}
            index={index}
            optionTypes={optionTypes}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}
      </CardContent>
    </Card>
  );
}
