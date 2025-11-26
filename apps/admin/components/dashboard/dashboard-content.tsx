"use client";

import { DashboardError } from "@/components/dashboard/dashboard-error";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { StatsChart } from "@/components/dashboard/stats-chart";
import { useAdminStats } from "@/hooks/use-admin-stats";
import { useRecentOrders } from "@/hooks/use-recent-orders";

export function DashboardContent() {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useAdminStats();

  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
  } = useRecentOrders(5);

  const error = statsError || ordersError;
  const isLoading = statsLoading || ordersLoading;

  if (error) {
    return <DashboardError error={error} />;
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your ecommerce platform
        </p>
      </div>

      <OverviewCards stats={stats ?? null} isLoading={isLoading} />

      <StatsChart stats={stats ?? null} isLoading={isLoading} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <RecentOrders orders={ordersData?.data ?? null} isLoading={isLoading} />
      </div>
    </div>
  );
}
