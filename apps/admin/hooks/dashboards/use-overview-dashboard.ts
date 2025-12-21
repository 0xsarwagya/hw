"use client";

import { endpoints } from "@/lib/endpoints";
import { useApiQuery } from "../use-api-query";

export interface OverviewDashboard {
  totalRevenue: number;
  monthlyRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  totalProducts: number;
  activeProducts: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  outOfStockProducts: number;
  totalRefunds: number;
  refundRate: number;
  averageRating: number;
  totalReviews: number;
}

export function useOverviewDashboard() {
  return useApiQuery<OverviewDashboard>(endpoints.dashboards.overview, {
    refetchInterval: 60000, // Refresh every minute
  });
}
