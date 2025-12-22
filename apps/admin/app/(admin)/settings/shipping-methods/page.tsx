import { ShippingMethodsPageClient } from "@/components/shipping/shipping-methods-page-client";

/**
 * Shipping methods list page - Server component
 * Delegates all client-side logic to ShippingMethodsPageClient component
 */
export default function ShippingMethodsPage() {
  return <ShippingMethodsPageClient />;
}
