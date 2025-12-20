"use client";

import { use } from "react";
import { QueryState } from "@/components/common/query-state";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { InventoryDetailSkeleton } from "@/components/skeletons/inventory-detail-skeleton";
import { useInventoryItem } from "@/hooks/inventory/use-inventory-item";
import { InventoryDetailTabs } from "./inventory-detail-tabs";
import { InventoryStatsCard } from "./inventory-stats-card";
import { VariantSummaryCard } from "./variant-summary-card";

interface InventoryDetailClientProps {
  params: Promise<{ variantId: string }>;
}

/**
 * Client component for inventory detail page
 */
export function InventoryDetailClient({ params }: InventoryDetailClientProps) {
  const { variantId } = use(params);
  const { data: item, isLoading, error } = useInventoryItem(variantId);

  return (
    <AdminPageLayout
      title={item?.title || "Inventory Detail"}
      description={item?.sku ? `SKU: ${item.sku}` : "View inventory details"}
    >
      <QueryState
        isLoading={isLoading}
        error={error}
        data={item}
        loadingComponent={<InventoryDetailSkeleton />}
        onRetry={() => window.location.reload()}
      >
        {item && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VariantSummaryCard item={item} />
              <InventoryStatsCard item={item} />
            </div>

            <InventoryDetailTabs variantId={variantId} item={item} />
          </div>
        )}
      </QueryState>
    </AdminPageLayout>
  );
}
