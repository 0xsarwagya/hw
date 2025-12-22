"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
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
import { useVariantsIndex } from "@/hooks/inventory/use-variants-index";
import { cn } from "@/lib/utils";

interface VariantSelectorProps {
  selectedVariantId?: string;
  onSelect: (variantId: string) => void;
  excludedVariantIds?: string[];
  placeholder?: string;
}

export function VariantSelector({
  selectedVariantId,
  onSelect,
  excludedVariantIds = [],
  placeholder = "Select variant...",
}: VariantSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: variantsIndex, isLoading } = useVariantsIndex();

  const variants = variantsIndex?.variants || [];
  const availableVariants = variants.filter(
    (v) => !excludedVariantIds.includes(v.variantId),
  );

  const selectedVariant = variants.find(
    (v) => v.variantId === selectedVariantId,
  );

  const handleSelect = (variantId: string) => {
    onSelect(variantId);
    setOpen(false);
  };

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
          {selectedVariant
            ? `${selectedVariant.sku} - ${selectedVariant.productTitle}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by SKU or product title..." />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading variants..." : "No variants found."}
            </CommandEmpty>
            <CommandGroup>
              {availableVariants.map((variant) => (
                <CommandItem
                  key={variant.variantId}
                  value={`${variant.sku} ${variant.productTitle}`}
                  onSelect={() => handleSelect(variant.variantId)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedVariantId === variant.variantId
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{variant.sku}</span>
                    <span className="text-sm text-muted-foreground">
                      {variant.productTitle}
                    </span>
                    {variant.attributes &&
                      Object.keys(variant.attributes).length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {Object.entries(variant.attributes)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(", ")}
                        </span>
                      )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
