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
import { useAdminAddVariantOptionValue } from "@/hooks/products/use-admin-add-variant-option-value";
import { useAdminDeleteVariantOptionValue } from "@/hooks/products/use-admin-delete-variant-option-value";
import type { ProductVariantOptionType } from "@/lib/types/products";
import { OptionValueList } from "./option-value-list";

interface OptionTypeCardProps {
  productId: string;
  optionType: ProductVariantOptionType;
  onDelete: () => void;
}

/**
 * Card component for displaying and managing a single option type
 */
export function OptionTypeCard({
  productId,
  optionType,
  onDelete,
}: OptionTypeCardProps) {
  const addValue = useAdminAddVariantOptionValue(productId, optionType.id);
  const deleteValue = useAdminDeleteVariantOptionValue(
    productId,
    optionType.id,
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{optionType.name}</CardTitle>
            {optionType.optionTypeId && (
              <CardDescription className="text-xs mt-1">
                Using template
              </CardDescription>
            )}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <OptionValueList
          values={optionType.values || []}
          onAdd={async (value) => {
            await addValue.mutateAsync({ value });
          }}
          onDelete={async (valueId) => {
            await deleteValue.mutateAsync({ valueId });
          }}
          isAddingPending={addValue.isPending}
        />
      </CardContent>
    </Card>
  );
}
