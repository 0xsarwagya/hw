"use client";

import { endpoints } from "@/lib/endpoints";
import { useApiQuery } from "../use-api-query";

export interface OrderStatusCounts {
  pending: number;
  packed: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export interface DelayedOrder {
  orderId: string;
  orderNumber: string;
  daysDelayed: number;
  status: string;
  expectedDeliveryDate: string;
}

export interface RtoMetrics {
  rtoRate: number;
  totalRtoOrders: number;
  rtoThisMonth: number;
}

export interface InventoryAging {
  days0to30: number;
  days31to60: number;
  days61to90: number;
  days90Plus: number;
}

export interface OutOfStockAlert {
  productId: string;
  productTitle: string;
  inventory: number;
  daysOutOfStock: number;
}

export interface ShippingMetrics {
  averageShippingTime: number;
  averageTimeByCourier: Record<string, number>;
  slaBreaches: number;
  slaBreachRate: number;
}

export interface OperationsDashboard {
  orderStatusCounts: OrderStatusCounts;
  delayedOrders: DelayedOrder[];
  rto: RtoMetrics;
  inventoryAging: InventoryAging;
  outOfStockAlerts: OutOfStockAlert[];
  shipping: ShippingMetrics;
}

export function useOperationsDashboard() {
  return useApiQuery<OperationsDashboard>(endpoints.dashboards.operations, {
    refetchInterval: 60000, // Refresh every minute
  });
}
