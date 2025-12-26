"use client";

import { ExternalLink, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { useInventoryList } from "@/hooks/inventory/use-inventory-list";
import { useVariantsIndex } from "@/hooks/inventory/use-variants-index";
import type { BundleSet } from "@/lib/types/bundles";
import { Money } from "../orders/money";
import { EnhancedVariantSelector } from "./enhanced-variant-selector";

interface EnhancedBundleSetItemsListProps {
  bundleId: string;
  bundleSet: BundleSet;
  onItemsChange?: () => void;
}

/**
 * Enhanced bundle set items list with images, pricing, and inventory information
 */
export function EnhancedBundleSetItemsList({
  bundleId,
  bundleSet,
  onItemsChange,
}: EnhancedBundleSetItemsListProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");

  const { data: variantsIndex } = useVariantsIndex();
  const { data: inventoryData } = useInventoryList({
    limit: 1000,
  });

  const addItem = useAdminAddBundleSetItem(bundleId, bundleSet.id);
  const removeItem = useAdminRemoveBundleSetItem(bundleId, bundleSet.id);

  const existingVariantIds = bundleSet.items.map((item) => item.variantId);
  const variants = variantsIndex?.variants || [];

  // Create inventory map
  const inventoryMap = new Map(
    inventoryData?.data?.map((item) => [item.variantId, item]) || [],
  );

  const getVariantInfo = (variantId: string) => {
    return variants.find((v) => v.variantId === variantId);
  };

  const getInventoryInfo = (variantId: string) => {
    return inventoryMap.get(variantId);
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
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Attributes</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundleSet.items.map((item) => {
                const variant = getVariantInfo(item.variantId);
                const inventory = getInventoryInfo(item.variantId);
                const isOutOfStock = inventory && inventory.inventory <= 0;
                const isLowStock =
                  inventory && inventory.lowStock && !isOutOfStock;

                if (!variant) {
                  return (
                    <TableRow key={item.id}>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        Variant not found ({item.variantId})
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        {/* TODO: Add actual product image when available */}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{variant.productTitle}</div>
                      {variant.attributes &&
                        Object.keys(variant.attributes).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(variant.attributes).map(
                              ([key, value]) => (
                                <Badge
                                  key={key}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {key}: {value}
                                </Badge>
                              ),
                            )}
                          </div>
                        )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {variant.sku}
                      </code>
                    </TableCell>
                    <TableCell>
                      {variant.attributes &&
                      Object.keys(variant.attributes).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(variant.attributes).map(
                            ([key, value]) => (
                              <Badge
                                key={key}
                                variant="outline"
                                className="text-xs"
                              >
                                {key}: {value}
                              </Badge>
                            ),
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {inventory ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                isOutOfStock
                                  ? "destructive"
                                  : isLowStock
                                    ? "outline"
                                    : "default"
                              }
                              className={
                                isLowStock
                                  ? "border-orange-500 text-orange-600"
                                  : ""
                              }
                            >
                              {isOutOfStock
                                ? "Out of Stock"
                                : isLowStock
                                  ? "Low Stock"
                                  : "In Stock"}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {inventory.inventory} units
                            {inventory.available !== undefined &&
                              inventory.available !== inventory.inventory && (
                                <span className="ml-1">
                                  ({inventory.available} available)
                                </span>
                              )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          N/A
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {inventory?.productId && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            asChild
                            title="View Product"
                          >
                            <Link
                              href={`/products/${inventory.productId}`}
                              target="_blank"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={removeItem.isPending}
                          title="Remove Variant"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
