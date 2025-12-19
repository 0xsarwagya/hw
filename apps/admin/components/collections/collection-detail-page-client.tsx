"use client";

import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAddProductsToCollection } from "@/hooks/collections/use-admin-add-products-to-collection";
import { useAdminCollection } from "@/hooks/collections/use-admin-collection";
import { useAdminCollectionProducts } from "@/hooks/collections/use-admin-collection-products";
import { useAdminRemoveProductFromCollection } from "@/hooks/collections/use-admin-remove-product-from-collection";
import { useAdminUpdateCollection } from "@/hooks/collections/use-admin-update-collection";
import { BREADCRUMB_LABELS, ROUTES } from "@/lib/constants/routes.constants";
import type { UpdateCollectionInput } from "@/lib/types/collections";
import { AddProductsDialog } from "./add-products-dialog";
import { CollectionFormWizard } from "./collection-form-wizard";
import { CollectionPreviewPanel } from "./collection-preview-panel";
import { CollectionProductsTable } from "./collection-products-table";

export function CollectionDetailPageClient() {
  const params = useParams();
  const _router = useRouter();
  const collectionId = params.collectionId as string;

  const { data: collection, isLoading: isLoadingCollection } =
    useAdminCollection(collectionId);
  const { data: products, isLoading: isLoadingProducts } =
    useAdminCollectionProducts(collectionId);
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
    if (
      confirm(
        "Are you sure you want to remove this product from the collection?",
      )
    ) {
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
            <Link href={ROUTES.PRODUCTS.COLLECTIONS.LIST}>
              Back to Collections
            </Link>
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  const existingProductIds = products?.map((p) => p.id) || [];

  return (
    <AdminPageLayout
      title={
        <div className="flex items-center gap-2">
          {collection.name}
          {collection.type && (
            <Badge
              variant={
                collection.type === "automatic" ? "default" : "secondary"
              }
            >
              {collection.type === "automatic" ? "Automatic" : "Manual"}
            </Badge>
          )}
        </div>
      }
      description="Edit collection details and manage products"
      breadcrumbs={[
        { label: BREADCRUMB_LABELS.PRODUCTS, href: ROUTES.PRODUCTS.LIST },
        {
          label: BREADCRUMB_LABELS.COLLECTIONS,
          href: ROUTES.PRODUCTS.COLLECTIONS.LIST,
        },
        { label: collection.name },
      ]}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={ROUTES.PRODUCTS.COLLECTIONS.LIST}>
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
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {collection.type === "automatic" && collection.rules && (
            <Card>
              <CardHeader>
                <CardTitle>Collection Rules</CardTitle>
                <CardDescription>
                  Products matching{" "}
                  {collection.matchType === "all" ? "all" : "any"} rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {collection.rules.map((rule, index) => (
                    <div
                      key={`rule-${rule.field}-${rule.operator}-${index}`}
                      className="flex items-center gap-2 p-2 border rounded text-sm"
                    >
                      <span className="font-medium">{rule.field}</span>
                      <span className="text-muted-foreground">
                        {rule.operator}
                      </span>
                      <span>{String(rule.value)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <CollectionPreviewPanel
                    collectionId={collection.id}
                    rules={collection.rules}
                    matchType={collection.matchType || "all"}
                    enabled={true}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          <CollectionFormWizard
            collection={collection}
            onSubmit={handleSubmit}
            isLoading={updateCollection.isPending}
          />
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Products in Collection</CardTitle>
                  <CardDescription>
                    Manage products in this collection
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={() => setIsAddDialogOpen(true)}
                  disabled={addProducts.isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Products
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingProducts ? (
                <div className="text-sm text-muted-foreground">
                  Loading products...
                </div>
              ) : products && products.length > 0 ? (
                <CollectionProductsTable
                  products={products}
                  collectionId={collectionId}
                  onRemove={handleRemoveProduct}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm mb-4">No products in this collection</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Products
                  </Button>
                </div>
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
