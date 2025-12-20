import { PaymentFeesClient } from "@/components/settings/payment-fees-client";

/**
 * Payment fees settings page - Server component
 * Delegates all client-side logic to PaymentFeesClient component
 */
export default function PaymentFeesPage() {
  return <PaymentFeesClient />;
}
