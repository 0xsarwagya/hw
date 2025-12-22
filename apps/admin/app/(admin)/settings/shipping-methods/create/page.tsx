import { ShippingMethodCreatePageClient } from "@/components/shipping/shipping-method-create-page-client";

/**
 * Create shipping method page - Server component
 * Delegates all client-side logic to ShippingMethodCreatePageClient component
 */
export default function ShippingMethodCreatePage() {
  return <ShippingMethodCreatePageClient />;
}
