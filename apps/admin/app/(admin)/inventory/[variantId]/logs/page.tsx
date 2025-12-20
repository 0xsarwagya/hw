import { InventoryLogsClient } from "@/components/inventory/inventory-logs-client";

interface InventoryLogsPageProps {
  params: Promise<{ variantId: string }>;
}

/**
 * Inventory logs page - Server component
 * Delegates all client-side logic to InventoryLogsClient component
 */
export default function InventoryLogsPage({ params }: InventoryLogsPageProps) {
  return <InventoryLogsClient params={params} />;
}
