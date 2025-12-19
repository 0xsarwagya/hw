import { use } from "react";
import { ProductDetailClient } from "@/components/products/product-detail-client";

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

/**
 * Product detail page - Server component
 * Extracts productId from params and delegates to ProductDetailClient
 */
export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { productId } = use(params);
  return <ProductDetailClient productId={productId} />;
}
