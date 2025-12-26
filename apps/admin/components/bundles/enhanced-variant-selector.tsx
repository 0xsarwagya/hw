"use client";

import { Check, ChevronsUpDown, Image as ImageIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useInventoryList } from "@/hooks/inventory/use-inventory-list";
import { useVariantsIndex } from "@/hooks/inventory/use-variants-index";
import { cn } from "@/lib/utils";
import { Money } from "../orders/money";

interface EnhancedVariantSelectorProps {
  selectedVariantId?: string;
  onSelect: (variantId: string) => void;
  excludedVariantIds?: string[];
  placeholder?: string;
}

/**
 * Enhanced variant selector with images, pricing, and inventory information
 */
export function EnhancedVariantSelector({
  selectedVariantId,
  onSelect,
  excludedVariantIds = [],
  placeholder = "Select variant...",
}: EnhancedVariantSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: variantsIndex, isLoading: isLoadingIndex } =
    useVariantsIndex();
  const { data: inventoryData, isLoading: isLoadingInventory } =
    useInventoryList({
      limit: 1000, // Get all inventory items for better search
    });

  // Create a map of variantId -> inventory item for quick lookup
  const inventoryMap = useMemo(() => {
    if (!inventoryData?.data) return new Map();
    return new Map(
      inventoryData.data.map((item) => [item.variantId, item]),
    );
  }, [inventoryData]);

  const variants = variantsIndex?.variants || [];
  const availableVariants = variants.filter(
    (v) => !excludedVariantIds.includes(v.variantId),
  );

  // Filter variants by search query
  const filteredVariants = useMemo(() => {
    if (!searchQuery) return availableVariants;

    const query = searchQuery.toLowerCase();
    return availableVariants.filter((variant) => {
      const inventoryItem = inventoryMap.get(variant.variantId);
      const skuMatch = variant.sku.toLowerCase().includes(query);
      const titleMatch = variant.productTitle.toLowerCase().includes(query);
      const attributeMatch = variant.attributes
        ? Object.values(variant.attributes)
            .some((value) => value.toLowerCase().includes(query))
        : false;

      return skuMatch || titleMatch || attributeMatch;
    });
  }, [availableVariants, searchQuery, inventoryMap]);

  const selectedVariant = variants.find(
    (v) => v.variantId === selectedVariantId,
  );
  const selectedInventoryItem = selectedVariantId
    ? inventoryMap.get(selectedVariantId)
    : undefined;

  const handleSelect = (variantId: string) => {
    onSelect(variantId);
    setOpen(false);
    setSearchQuery("");
  };

  const isLoading = isLoadingIndex || isLoadingInventory;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {selectedVariant ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 rounded bg-muted flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate">
                  {selectedVariant.sku}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {selectedVariant.productTitle}
                </div>
              </div>
              {selectedInventoryItem && (
                <div className="flex-shrink-0">
                  <Badge
                    variant={
                      selectedInventoryItem.inventory > 0
                        ? "default"
                        : "destructive"
                    }
                    className="text-xs"
                  >
                    {selectedInventoryItem.inventory > 0
                      ? "In Stock"
                      : "Out of Stock"}
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search by SKU, product name, or attributes..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading variants..." : "No variants found."}
            </CommandEmpty>
            <CommandGroup>
              {filteredVariants.map((variant) => {
                const inventoryItem = inventoryMap.get(variant.variantId);
                const isSelected = selectedVariantId === variant.variantId;
                const isOutOfStock =
                  inventoryItem && inventoryItem.inventory <= 0;
                const isLowStock =
                  inventoryItem && inventoryItem.lowStock && !isOutOfStock;

                return (
                  <CommandItem
                    key={variant.variantId}
                    value={`${variant.sku} ${variant.productTitle} ${
                      variant.attributes
                        ? Object.values(variant.attributes).join(" ")
                        : ""
                    }`}
                    onSelect={() => handleSelect(variant.variantId)}
                    className="flex items-start gap-3 p-3"
                  >
                    <Check
                      className={cn(
                        "mt-1 h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      {/* TODO: Add actual product image when available */}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{variant.sku}</span>
                        {isOutOfStock && (
                          <Badge variant="destructive" className="text-xs">
                            Out of Stock
                          </Badge>
                        )}
                        {isLowStock && (
                          <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                            Low Stock
                          </Badge>
                        )}
                        {inventoryItem &&
                          !isOutOfStock &&
                          !isLowStock && (
                            <Badge variant="outline" className="text-xs">
                              In Stock
                            </Badge>
                          )}
                      </div>
                      <div className="text-sm font-medium text-foreground mb-1">
                        {variant.productTitle}
                      </div>
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
                      {inventoryItem && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Stock: {inventoryItem.inventory} units
                          {inventoryItem.available !== undefined &&
                            inventoryItem.available !== inventoryItem.inventory && (
                              <span className="ml-1">
                                ({inventoryItem.available} available)
                              </span>
                            )}
                        </div>
                      )}
                    </div>
                    {/* Note: Price would go here when available from variant API */}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

