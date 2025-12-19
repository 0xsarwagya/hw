import { CustomersPageClient } from "@/components/customers/customers-page-client";

/**
 * Customers page - Server component
 * Delegates all client-side logic to CustomersPageClient component
 */
export default function CustomersPage() {
  return <CustomersPageClient />;
}
