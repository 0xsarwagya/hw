"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { AddProductsDialog } from "@/components/collections/add-products-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminCategories } from "@/hooks/categories/use-admin-categories";
import { useAdminCollections } from "@/hooks/collections/use-admin-collections";

interface DiscountRuleBuilderProps {
  productIds?: string[];
  categoryIds?: string[];
  collectionIds?: string[];
  tagIds?: string[];
  onProductIdsChange: (ids: string[]) => void;
  onCategoryIdsChange: (ids: string[]) => void;
  onCollectionIdsChange: (ids: string[]) => void;
  onTagIdsChange?: (ids: string[]) => void;
}

export function DiscountRuleBuilder({
  productIds = [],
  categoryIds = [],
  collectionIds = [],
  onProductIdsChange,
  onCategoryIdsChange,
  onCollectionIdsChange,
}: DiscountRuleBuilderProps) {
  const [_selectedFilterType, _setSelectedFilterType] = useState<
    "product" | "category" | "collection" | "tag"
  >("product");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [_categoryDialogOpen, _setCategoryDialogOpen] = useState(false);
  const [_collectionDialogOpen, _setCollectionDialogOpen] = useState(false);

  const { data: categoriesData } = useAdminCategories();
  const { data: collectionsData } = useAdminCollections();

  const categories = categoriesData || [];
  const collections = collectionsData?.data || [];

  const handleAddProducts = async (productIdsToAdd: string[]) => {
    onProductIdsChange([...productIds, ...productIdsToAdd]);
  };

  const handleRemoveProduct = (id: string) => {
    onProductIdsChange(productIds.filter((pid) => pid !== id));
  };

  const handleAddCategory = (categoryId: string) => {
    if (!categoryIds.includes(categoryId)) {
      onCategoryIdsChange([...categoryIds, categoryId]);
    }
  };

  const handleRemoveCategory = (id: string) => {
    onCategoryIdsChange(categoryIds.filter((cid) => cid !== id));
  };

  const handleAddCollection = (collectionId: string) => {
    if (!collectionIds.includes(collectionId)) {
      onCollectionIdsChange([...collectionIds, collectionId]);
    }
  };

  const handleRemoveCollection = (id: string) => {
    onCollectionIdsChange(collectionIds.filter((cid) => cid !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Product Filters</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Select products, categories, collections, or tags to apply this
          discount to
        </p>
      </div>

      {/* Products */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Products</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setProductDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Products
          </Button>
        </div>
        {productIds.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {productIds.map((id) => (
              <Badge key={id} variant="secondary" className="px-3 py-1">
                {id}
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(id)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No products selected. Click "Add Products" to select products.
          </p>
        )}
        <AddProductsDialog
          open={productDialogOpen}
          onOpenChange={setProductDialogOpen}
          onAdd={handleAddProducts}
          existingProductIds={productIds}
        />
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Categories</Label>
          <Select
            value=""
            onValueChange={(value) => {
              if (value) handleAddCategory(value);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter((cat) => !categoryIds.includes(cat.id))
                .map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        {categoryIds.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {categoryIds.map((id) => {
              const category = categories.find((c) => c.id === id);
              return (
                <Badge key={id} variant="secondary" className="px-3 py-1">
                  {category?.name || id}
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(id)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No categories selected
          </p>
        )}
      </div>

      {/* Collections */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Collections</Label>
          <Select
            value=""
            onValueChange={(value) => {
              if (value) handleAddCollection(value);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select collection" />
            </SelectTrigger>
            <SelectContent>
              {collections
                .filter((col) => !collectionIds.includes(col.id))
                .map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        {collectionIds.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {collectionIds.map((id) => {
              const collection = collections.find((c) => c.id === id);
              return (
                <Badge key={id} variant="secondary" className="px-3 py-1">
                  {collection?.name || id}
                  <button
                    type="button"
                    onClick={() => handleRemoveCollection(id)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No collections selected
          </p>
        )}
      </div>

      {/* Tags - Placeholder for now */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <p className="text-sm text-muted-foreground">
          Tag filtering will be available in a future update
        </p>
      </div>
    </div>
  );
}
