"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { CollectionForm } from "@/components/collections/collection-form";
import { CollectionProductsTable } from "@/components/collections/collection-products-table";
import { AddProductsDialog } from "@/components/collections/add-products-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { useAdminCollection } from "@/hooks/collections/use-admin-collection";
import { useAdminUpdateCollection } from "@/hooks/collections/use-admin-update-collection";
import { useAdminCollectionProducts } from "@/hooks/collections/use-admin-collection-products";
import { useAdminAddProductsToCollection } from "@/hooks/collections/use-admin-add-products-to-collection";
import { useAdminRemoveProductFromCollection } from "@/hooks/collections/use-admin-remove-product-from-collection";
import type { UpdateCollectionInput } from "@/lib/types/collections";

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.collectionId as string;

  const { data: collection, isLoading: isLoadingCollection } = useAdminCollection(collectionId);
  const { data: products, isLoading: isLoadingProducts } = useAdminCollectionProducts(collectionId);
  const updateCollection = useAdminUpdateCollection(collectionId);
  const addProducts = useAdminAddProductsToCollection(collectionId);
  const removeProduct = useAdminRemoveProductFromCollection(collectionId);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleSubmit = async (data: UpdateCollectionInput) => {
    await updateCollection.mutateAsync(data);
  };

  const handleAddProducts = async (productIds: string[]) => {
    await addProducts.mutateAsync({ productIds });
  };

  const handleRemoveProduct = async (productId: string) => {
    if (confirm("Are you sure you want to remove this product from the collection?")) {
      await removeProduct.mutateAsync(productId);
    }
  };

  if (isLoadingCollection) {
    return (
      <AdminPageLayout title="Collection" description="Loading...">
        <div className="space-y-6">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </AdminPageLayout>
    );
  }

  if (!collection) {
    return (
      <AdminPageLayout title="Collection" description="Collection not found">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Collection not found</p>
          <Button asChild className="mt-4">
            <Link href="/products/collections">Back to Collections</Link>
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  const existingProductIds = products?.map((p) => p.id) || [];

  return (
    <AdminPageLayout
      title={collection.name}
      description="Edit collection details and manage products"
      breadcrumbs={[
        { label: "Products", href: "/products" },
        { label: "Collections", href: "/products/collections" },
        { label: collection.name },
      ]}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/products/collections">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      }
    >
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="products">
            Products ({products?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <CollectionForm
            collection={collection}
            onSubmit={handleSubmit}
            isLoading={updateCollection.isPending}
          />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Products in Collection</CardTitle>
                  <CardDescription>
                    Manage products in this collection
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Products
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingProducts ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading products...
                </div>
              ) : (
                <CollectionProductsTable
                  products={products || []}
                  collectionId={collectionId}
                  onRemove={handleRemoveProduct}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddProductsDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddProducts}
        existingProductIds={existingProductIds}
        isLoading={addProducts.isPending}
      />
    </AdminPageLayout>
  );
}

