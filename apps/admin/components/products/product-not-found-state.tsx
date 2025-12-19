import Link from "next/link";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Button } from "@/components/ui/button";

/**
 * Component displayed when a product is not found
 */
export function ProductNotFoundState() {
  return (
    <AdminPageLayout title="Product" description="Product not found">
      <div className="text-center py-8">
        <p className="text-muted-foreground">Product not found</p>
        <Button asChild className="mt-4">
          <Link href="/products">Back to Products</Link>
        </Button>
      </div>
    </AdminPageLayout>
  );
}
