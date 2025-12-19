"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminProducts } from "@/hooks/products/use-admin-products";
import type { Product } from "@/lib/types/products";
import { AddProductsDialog } from "./add-products-dialog";

interface CollectionManualProductsProps {
  selectedProducts: Product[];
  onProductsChange: (products: Product[]) => void;
}

export function CollectionManualProducts({
  selectedProducts,
  onProductsChange,
}: CollectionManualProductsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([]);
  const selectedProductsRef = useRef(selectedProducts);

  // Keep ref in sync with selectedProducts
  useEffect(() => {
    selectedProductsRef.current = selectedProducts;
  }, [selectedProducts]);

  // Fetch products when we have pending IDs
  const { data: productsData } = useAdminProducts(
    pendingProductIds.length > 0
      ? {
          // Fetch all products and filter client-side since we don't have an "ids" filter
          limit: 1000,
          page: 1,
        }
      : undefined,
  );

  // When products are fetched, add them to selected products
  useEffect(() => {
    if (pendingProductIds.length > 0 && productsData?.data) {
      const newProducts = productsData.data.filter((p) =>
        pendingProductIds.includes(p.id),
      );

      if (newProducts.length > 0) {
        // Use ref to get latest selectedProducts without adding to dependencies
        const currentSelected = selectedProductsRef.current;
        const existingIds = new Set(currentSelected.map((p) => p.id));
        const uniqueNewProducts = newProducts.filter(
          (p) => !existingIds.has(p.id),
        );

        if (uniqueNewProducts.length > 0) {
          onProductsChange([...currentSelected, ...uniqueNewProducts]);
        }
      }

      // Clear pending IDs to prevent re-running
      setPendingProductIds([]);
    }
  }, [productsData, pendingProductIds, onProductsChange]);

  const handleAddProducts = async (productIds: string[]) => {
    if (productIds.length === 0) return;
    // Set pending IDs to trigger the fetch
    setPendingProductIds(productIds);
  };

  const handleRemoveProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter((p) => p.id !== productId));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Selected Products</h3>
          <p className="text-sm text-muted-foreground">
            {selectedProducts.length} product(s) selected
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setDialogOpen(true)}
          variant="outline"
        >
          Add Products
        </Button>
      </div>

      {selectedProducts.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground mb-4">
            No products selected. Click "Add Products" to select products for
            this collection.
          </p>
          <Button
            type="button"
            onClick={() => setDialogOpen(true)}
            variant="outline"
          >
            Add Products
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {selectedProducts.map((product) => (
            <Badge key={product.id} variant="secondary" className="px-3 py-1">
              {product.title}
              <button
                type="button"
                onClick={() => handleRemoveProduct(product.id)}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <AddProductsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAddProducts}
        existingProductIds={selectedProducts.map((p) => p.id)}
      />
    </div>
  );
}
