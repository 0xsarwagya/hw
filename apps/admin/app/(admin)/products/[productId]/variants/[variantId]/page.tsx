import { EditVariantPageClient } from "@/components/products/variants/edit-variant-page-client";

interface VariantDetailPageProps {
  params: Promise<{ productId: string; variantId: string }>;
}

export default async function VariantDetailPage({
  params,
}: VariantDetailPageProps) {
  const { productId, variantId } = await params;

  return <EditVariantPageClient productId={productId} variantId={variantId} />;
}
