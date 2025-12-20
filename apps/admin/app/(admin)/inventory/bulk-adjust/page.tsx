import { BulkAdjustClient } from "@/components/inventory/bulk-adjust-client";

/**
 * Bulk adjust inventory page - Server component
 * Delegates all client-side logic to BulkAdjustClient component
 */
export default function BulkAdjustPage() {
  return <BulkAdjustClient />;
}
