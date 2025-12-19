"use client";

import Link from "next/link";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { ProductDetailSkeleton } from "@/components/skeletons/product-detail-skeleton";
import { Button } from "@/components/ui/button";
import { useAdminProduct } from "@/hooks/products/use-admin-product";
import { CreateVariantForm } from "./create-variant-form";

interface CreateVariantPageClientProps {
  productId: string;
}

export function CreateVariantPageClient({
  productId,
}: CreateVariantPageClientProps) {
  const { data: product, isLoading: isLoadingProduct } =
    useAdminProduct(productId);

  if (isLoadingProduct) {
    return (
      <AdminPageLayout title="Create Variant" description="Loading...">
        <ProductDetailSkeleton />
      </AdminPageLayout>
    );
  }

  if (!product) {
    return (
      <AdminPageLayout title="Create Variant" description="Product not found">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Product not found</p>
          <Button asChild className="mt-4">
            <Link href="/products">Back to Products</Link>
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={`${product.title} - New Variant`}
      description="Create a new variant"
      breadcrumbs={[
        { label: "Products", href: "/products" },
        { label: product.title, href: `/products/${productId}` },
        { label: "New Variant" },
      ]}
    >
      <CreateVariantForm
        productId={productId}
        productTitle={product.title}
        defaultPrice={product.price}
      />
    </AdminPageLayout>
  );
}
