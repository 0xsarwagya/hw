"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UseFormReturn } from "react-hook-form";
import type { UpdateProductFormValues } from "@/lib/validations/products";
import type { Variant, ProductImage } from "@/lib/types/products";
import type { Category } from "@/lib/types/categories";
import type { Collection } from "@/lib/types/collections";
import { ProductDetailsTab } from "./tabs/product-details-tab";
import { ProductImagesTab } from "./tabs/product-images-tab";
import { ProductVariantsTab } from "./tabs/product-variants-tab";
import { ProductCategoriesTab } from "./tabs/product-categories-tab";
import { ProductCollectionsTab } from "./tabs/product-collections-tab";

interface ProductDetailTabsProps {
  productId: string;
  form: UseFormReturn<UpdateProductFormValues>;
  variants: Variant[];
  images: ProductImage[];
  allCategories: Category[];
  allCollections: Collection[];
  selectedCollectionIds: Set<string>;
  onCollectionToggle: (collectionId: string, checked: boolean) => void;
  onDeleteVariant: (variantId: string) => void;
}

/**
 * Tabs component for product detail page
 * Organizes product editing into separate sections
 */
export function ProductDetailTabs({
  productId,
  form,
  variants,
  images,
  allCategories,
  allCollections,
  selectedCollectionIds,
  onCollectionToggle,
  onDeleteVariant,
}: ProductDetailTabsProps) {
  return (
    <Tabs defaultValue="details" className="space-y-4">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="images">Images</TabsTrigger>
        <TabsTrigger value="variants">Variants</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
        <TabsTrigger value="collections">Collections</TabsTrigger>
      </TabsList>

      <TabsContent value="details">
        <ProductDetailsTab form={form} />
      </TabsContent>

      <TabsContent value="images">
        <ProductImagesTab productId={productId} images={images} />
      </TabsContent>

      <TabsContent value="variants">
        <ProductVariantsTab
          productId={productId}
          variants={variants}
          onDeleteVariant={onDeleteVariant}
        />
      </TabsContent>

      <TabsContent value="categories">
        <ProductCategoriesTab form={form} allCategories={allCategories} />
      </TabsContent>

      <TabsContent value="collections">
        <ProductCollectionsTab
          allCollections={allCollections}
          selectedCollectionIds={selectedCollectionIds}
          onCollectionToggle={onCollectionToggle}
        />
      </TabsContent>
    </Tabs>
  );
}

