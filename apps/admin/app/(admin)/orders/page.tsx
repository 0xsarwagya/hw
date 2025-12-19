import { OrdersPageClient } from "@/components/orders/orders-page-client";

/**
 * Orders page - Server component
 * Delegates all client-side logic to OrdersPageClient component
 */
export default function OrdersPage() {
  return <OrdersPageClient />;
}
