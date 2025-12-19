import { CreateVariantPageClient } from "@/components/products/variants/create-variant-page-client";

interface CreateVariantPageProps {
  params: Promise<{ productId: string }>;
}

export default async function CreateVariantPage({
  params,
}: CreateVariantPageProps) {
  const { productId } = await params;

  return <CreateVariantPageClient productId={productId} />;
}
