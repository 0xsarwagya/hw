"use client";

import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { useAdminDiscountProfile } from "@/hooks/discounts/use-admin-discount-profile";
import { DiscountProfilerPanel } from "./discount-profiler-panel";

export function DiscountProfilerPageClient() {
  const { data: metrics, isLoading, error } = useAdminDiscountProfile();

  return (
    <AdminPageLayout
      title="Discount Profiler"
      description="Monitor discount engine performance and metrics"
    >
      {error && (
        <div className="p-4 border border-destructive rounded-lg bg-destructive/10 text-destructive mb-6">
          Error loading profiler metrics: {error.message}
        </div>
      )}

      <DiscountProfilerPanel metrics={metrics || null} isLoading={isLoading} />
    </AdminPageLayout>
  );
}
