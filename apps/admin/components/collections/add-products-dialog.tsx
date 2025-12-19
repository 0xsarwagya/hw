"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Check, X } from "lucide-react";
import { useAdminProducts } from "@/hooks/products/use-admin-products";
import { ProductCard } from "@/components/products/product-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import type { Product } from "@/lib/types/products";
import Link from "next/link";

interface AddProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (productIds: string[]) => Promise<void>;
  existingProductIds?: string[];
  isLoading?: boolean;
}

export function AddProductsDialog({
  open,
  onOpenChange,
  onAdd,
  existingProductIds = [],
  isLoading = false,
}: AddProductsDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  const { data: productsData, isLoading: isLoadingProducts } = useAdminProducts({
    search,
    limit: 20,
    page: 1,
  });

  const products = productsData?.data || [];
  const availableProducts = products.filter((p) => !existingProductIds.includes(p.id));

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleAdd = async () => {
    if (selectedProductIds.size === 0) return;
    await onAdd(Array.from(selectedProductIds));
    setSelectedProductIds(new Set());
    setSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Products to Collection</DialogTitle>
          <DialogDescription>
            Search and select products to add to this collection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[400px] border rounded-md p-4">
            {isLoadingProducts ? (
              <div className="text-center py-8 text-muted-foreground">Loading products...</div>
            ) : availableProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {search ? "No products found" : "No products available"}
              </div>
            ) : (
              <div className="space-y-2">
                {availableProducts.map((product) => {
                  const isSelected = selectedProductIds.has(product.id);
                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 border rounded-md hover:bg-accent cursor-pointer"
                      onClick={() => handleToggleProduct(product.id)}
                    >
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleToggleProduct(product.id)}
                      />
                      <Label
                        htmlFor={`product-${product.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <Link href={`/products/${product.id}`} className="font-medium hover:underline">
                            {product.title}
                          </Link>
                          <span className="text-sm text-muted-foreground">
                            ₹{product.price.toLocaleString()}
                          </span>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {selectedProductIds.size > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedProductIds.size} product{selectedProductIds.size !== 1 ? "s" : ""} selected
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={selectedProductIds.size === 0 || isLoading}>
            {isLoading ? "Adding..." : `Add ${selectedProductIds.size} Product${selectedProductIds.size !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

