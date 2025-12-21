"use client";

import { endpoints } from "@/lib/endpoints";
import { useApiQuery } from "../use-api-query";

export interface RevenueMetrics {
  totalRevenue: number;
  averageOrderValue: number;
  totalProfit: number;
  grossMargin: number;
  netMargin: number;
}

export interface OrderVolume {
  totalOrders: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
}

export interface ConversionMetrics {
  conversionRate: number;
  totalVisitors: number;
  totalSessions: number;
}

export interface MarketingMetrics {
  cac: number;
  roas: number;
  marketingSpend: number;
}

export interface RefundMetrics {
  refundRate: number;
  totalRefunds: number;
  totalRefundAmount: number;
  cancellationRate: number;
}

export interface TrendDataPoint {
  date: string;
  value: number;
}

export interface TrafficSource {
  source: string;
  visitors: number;
  revenue: number;
  conversionRate: number;
}

export interface PerformanceDashboard {
  revenue: RevenueMetrics;
  orderVolume: OrderVolume;
  conversion: ConversionMetrics;
  marketing: MarketingMetrics;
  refunds: RefundMetrics;
  dailyTrends: TrendDataPoint[];
  weeklyTrends: TrendDataPoint[];
  monthlyTrends: TrendDataPoint[];
  trafficSources: TrafficSource[];
}

export function usePerformanceDashboard() {
  return useApiQuery<PerformanceDashboard>(endpoints.dashboards.performance, {
    refetchInterval: 60000, // Refresh every minute
  });
}
