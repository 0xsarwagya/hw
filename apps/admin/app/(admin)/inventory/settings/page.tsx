import { InventorySettingsClient } from "@/components/inventory/inventory-settings-client";

/**
 * Inventory settings page - Server component
 * Delegates all client-side logic to InventorySettingsClient component
 */
export default function InventorySettingsPage() {
  return <InventorySettingsClient />;
}
