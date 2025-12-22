import { ShippingMethodDetailPageClient } from "@/components/shipping/shipping-method-detail-page-client";

/**
 * Shipping method detail/edit page - Server component
 * Delegates all client-side logic to ShippingMethodDetailPageClient component
 */
export default function ShippingMethodDetailPage() {
  return <ShippingMethodDetailPageClient />;
}
