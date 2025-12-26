"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminAddBundleSetItem } from "@/hooks/bundles/use-admin-add-bundle-set-item";
import { useAdminRemoveBundleSetItem } from "@/hooks/bundles/use-admin-remove-bundle-set-item";
import { useVariantsIndex } from "@/hooks/inventory/use-variants-index";
import type { BundleSet } from "@/lib/types/bundles";
import { EnhancedVariantSelector } from "./enhanced-variant-selector";

interface BundleSetItemsListProps {
  bundleId: string;
  bundleSet: BundleSet;
  onItemsChange?: () => void;
}

export function BundleSetItemsList({
  bundleId,
  bundleSet,
  onItemsChange,
}: BundleSetItemsListProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const { data: variantsIndex } = useVariantsIndex();
  const addItem = useAdminAddBundleSetItem(bundleId, bundleSet.id);
  const removeItem = useAdminRemoveBundleSetItem(bundleId, bundleSet.id);

  const existingVariantIds = bundleSet.items.map((item) => item.variantId);
  const variants = variantsIndex?.variants || [];

  const getVariantInfo = (variantId: string) => {
    return variants.find((v) => v.variantId === variantId);
  };

  const handleAddItem = async () => {
    if (!selectedVariantId) return;

    try {
      await addItem.mutateAsync({ variantId: selectedVariantId });
      setSelectedVariantId("");
      onItemsChange?.();
    } catch (_error) {
      // Error is handled by the hook
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem.mutateAsync(itemId);
      onItemsChange?.();
    } catch (_error) {
      // Error is handled by the hook
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <EnhancedVariantSelector
            selectedVariantId={selectedVariantId}
            onSelect={setSelectedVariantId}
            excludedVariantIds={existingVariantIds}
            placeholder="Select a variant to add..."
          />
        </div>
        <Button
          type="button"
          onClick={handleAddItem}
          disabled={!selectedVariantId || addItem.isPending}
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Variant
        </Button>
      </div>

      {bundleSet.items.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No variants added yet. Add variants to this set.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Attributes</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundleSet.items.map((item) => {
                const variant = getVariantInfo(item.variantId);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {variant?.sku || item.variantId}
                    </TableCell>
                    <TableCell>
                      {variant?.productTitle || "Unknown product"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {variant?.attributes
                        ? Object.entries(variant.attributes)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(", ")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={removeItem.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
