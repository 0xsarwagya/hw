"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminCategories } from "@/hooks/categories/use-admin-categories";
import { useAdminAddPriceListItem } from "@/hooks/pricing/use-admin-add-price-list-item";
import { useAdminProducts } from "@/hooks/products/use-admin-products";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { PriceListItem } from "@/lib/types/price-lists";
import { PriceListOverrideType } from "@/lib/types/price-lists";

interface PriceListItemTableProps {
  priceListId: string;
  items: PriceListItem[];
}

export function PriceListItemTable({
  priceListId,
  items,
}: PriceListItemTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [overrideType, setOverrideType] = useState<PriceListOverrideType>(
    PriceListOverrideType.PERCENTAGE,
  );
  const [overrideValue, setOverrideValue] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [scope, setScope] = useState<"product" | "category">("product");

  const addItem = useAdminAddPriceListItem(priceListId);
  const queryClient = useQueryClient();

  const { data: productsData } = useAdminProducts({ limit: 100 });
  const { data: categoriesData } = useAdminCategories();

  const products = productsData?.data || [];
  const categories = categoriesData || [];

  const handleAdd = async () => {
    if (!overrideValue) return;

    const value = parseFloat(overrideValue);
    if (Number.isNaN(value)) return;

    try {
      await addItem.mutateAsync({
        priceListId,
        [scope === "product" ? "productId" : "categoryId"]:
          scope === "product" ? selectedProductId : selectedCategoryId,
        overrideType,
        overrideValue: value,
      });
      setDialogOpen(false);
      setOverrideValue("");
      setSelectedProductId("");
      setSelectedCategoryId("");
    } catch (_error) {
      // Error handled by hook
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!confirm("Remove this item from the price list?")) return;

    try {
      await api.delete<void>(
        endpoints.priceLists.removeItem(priceListId, itemId),
      );
      queryClient.invalidateQueries({
        queryKey: [endpoints.priceLists.detail(priceListId)],
      });
      toast.success("Price list item removed successfully");
    } catch (_error) {
      toast.error("Failed to remove price list item");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Price List Items</h3>
          <p className="text-sm text-muted-foreground">
            {items.length} item{items.length !== 1 ? "s" : ""} in this price
            list
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Price List Item</DialogTitle>
              <DialogDescription>
                Add a product or category override to this price list
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Scope</Label>
                <Select
                  value={scope}
                  onValueChange={(v) => setScope(v as "product" | "category")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scope === "product" ? (
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select
                    value={selectedProductId}
                    onValueChange={setSelectedProductId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={selectedCategoryId}
                    onValueChange={setSelectedCategoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Override Type</Label>
                <Select
                  value={overrideType}
                  onValueChange={(v) =>
                    setOverrideType(v as PriceListOverrideType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Override Value{" "}
                  {overrideType === "PERCENTAGE" ? "(0-100)" : "(INR)"}
                </Label>
                <Input
                  type="number"
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  placeholder={overrideType === "PERCENTAGE" ? "10" : "100"}
                  min="0"
                  max={overrideType === "PERCENTAGE" ? "100" : undefined}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={
                  !overrideValue ||
                  (scope === "product" && !selectedProductId) ||
                  (scope === "category" && !selectedCategoryId) ||
                  addItem.isPending
                }
              >
                {addItem.isPending ? "Adding..." : "Add Item"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground mb-4">
            No items in this price list. Click "Add Item" to add overrides.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Override</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.productVariantId
                      ? "Variant"
                      : item.productId
                        ? "Product"
                        : item.categoryId
                          ? "Category"
                          : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.productVariantId ||
                      item.productId ||
                      item.categoryId ||
                      "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.overrideType}</Badge>
                  </TableCell>
                  <TableCell>
                    {item.overrideType === "PERCENTAGE"
                      ? `${item.overrideValue}%`
                      : `₹${item.overrideValue.toLocaleString()}`}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
