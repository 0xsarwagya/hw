import { InventoryDetailClient } from "@/components/inventory/inventory-detail-client";

interface InventoryDetailPageProps {
  params: Promise<{ variantId: string }>;
}

/**
 * Inventory detail page - Server component
 * Delegates all client-side logic to InventoryDetailClient component
 */
export default function InventoryDetailPage({
  params,
}: InventoryDetailPageProps) {
  return <InventoryDetailClient params={params} />;
}
