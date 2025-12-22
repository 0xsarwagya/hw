import { Suspense } from "react";
import { ProductDetail } from "@/components/products/product-detail";

function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-muted h-96 rounded-lg" />
          <div>
            <div className="h-8 bg-muted rounded w-3/4 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mb-8" />
            <div className="h-10 bg-muted rounded w-full mb-4" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<ProductDetailLoading />}>
      <ProductDetailWrapper params={params} />
    </Suspense>
  );
}

async function ProductDetailWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetail productId={id} />;
}
