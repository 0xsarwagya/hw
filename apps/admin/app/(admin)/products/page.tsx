import { ProductsPageClient } from "@/components/products/products-page-client";

/**
 * Products page - Server component
 * Delegates all client-side logic to ProductsPageClient component
 */
export default function ProductsPage() {
  return <ProductsPageClient />;
}
