import { InventoryPageClient } from "@/components/inventory/inventory-page-client";

/**
 * Inventory list page - Server component
 * Delegates all client-side logic to InventoryPageClient component
 */
export default function InventoryPage() {
  return <InventoryPageClient />;
}
