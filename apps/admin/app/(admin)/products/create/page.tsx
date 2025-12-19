import { Suspense } from "react";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProductFormSkeleton } from "@/components/skeletons/product-form-skeleton";
import { CreateProductPageClient } from "@/components/products/create-product-page-client";

/**
 * Create product page - Server component
 * Delegates client-side logic to CreateProductPageClient component
 */
export default function CreateProductPage() {
  return (
    <AdminPageLayout
      title="Create Product"
      description="Add a new product to your catalog"
      breadcrumbs={[
        { label: "Products", href: "/products" },
        { label: "Create Product" },
      ]}
      actions={
        <Button variant="outline" asChild>
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      <Suspense fallback={<ProductFormSkeleton />}>
        <CreateProductPageClient />
      </Suspense>
    </AdminPageLayout>
  );
}

