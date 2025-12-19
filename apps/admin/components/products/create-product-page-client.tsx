"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ProductFormSkeleton } from "@/components/skeletons/product-form-skeleton";

// Lazy load the heavy CreateProductWizard component
const CreateProductWizard = dynamic(
  () =>
    import("@/components/products/create-product-wizard").then((mod) => ({
      default: mod.CreateProductWizard,
    })),
  {
    loading: () => <ProductFormSkeleton />,
  },
);

/**
 * Client component for create product page
 * Handles navigation after product creation
 */
export function CreateProductPageClient() {
  const router = useRouter();

  const handleComplete = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  return <CreateProductWizard onComplete={handleComplete} />;
}
