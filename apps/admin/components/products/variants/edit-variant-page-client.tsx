"use client";

import Link from "next/link";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { ProductDetailSkeleton } from "@/components/skeletons/product-detail-skeleton";
import { Button } from "@/components/ui/button";
import { useAdminProduct } from "@/hooks/products/use-admin-product";
import { useAdminVariant } from "@/hooks/products/use-admin-variant";
import { EditVariantForm } from "./edit-variant-form";

interface EditVariantPageClientProps {
  productId: string;
  variantId: string;
}

export function EditVariantPageClient({
  productId,
  variantId,
}: EditVariantPageClientProps) {
  const { data: product, isLoading: isLoadingProduct } =
    useAdminProduct(productId);
  const { data: variant, isLoading: isLoadingVariant } = useAdminVariant(
    productId,
    variantId,
  );

  if (isLoadingProduct || isLoadingVariant) {
    return (
      <AdminPageLayout title="Variant" description="Loading...">
        <ProductDetailSkeleton />
      </AdminPageLayout>
    );
  }

  if (!product || !variant) {
    return (
      <AdminPageLayout title="Variant" description="Variant not found">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Variant not found</p>
          <Button asChild className="mt-4">
            <Link href={`/products/${productId}`}>Back to Product</Link>
          </Button>
        </div>
      </AdminPageLayout>
    );
  }

  const getVariantName = () => {
    const parts: string[] = [];
    if (variant.size) parts.push(variant.size);
    if (variant.color) parts.push(variant.color);
    return parts.length > 0 ? parts.join(" / ") : "Default Variant";
  };

  return (
    <AdminPageLayout
      title={`${product.title} - ${getVariantName()}`}
      description="Edit variant details"
      breadcrumbs={[
        { label: "Products", href: "/products" },
        { label: product.title, href: `/products/${productId}` },
        { label: getVariantName() },
      ]}
    >
      <EditVariantForm productId={productId} variant={variant} />
    </AdminPageLayout>
  );
}
