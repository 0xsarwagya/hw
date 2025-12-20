"use client";

import { QueryState } from "@/components/common/query-state";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { InventorySettingsSkeleton } from "@/components/skeletons/inventory-settings-skeleton";
import { useInventorySettings } from "@/hooks/inventory/use-inventory-settings";
import { InventorySettingsForm } from "./inventory-settings-form";

/**
 * Client component for inventory settings page
 */
export function InventorySettingsClient() {
  const { data: settings, isLoading, error } = useInventorySettings();

  return (
    <AdminPageLayout
      title="Inventory Settings"
      description="Configure low stock thresholds and inventory settings"
    >
      <QueryState
        isLoading={isLoading}
        error={error}
        data={settings}
        loadingComponent={<InventorySettingsSkeleton />}
        onRetry={() => window.location.reload()}
      >
        {settings && <InventorySettingsForm settings={settings} />}
      </QueryState>
    </AdminPageLayout>
  );
}
