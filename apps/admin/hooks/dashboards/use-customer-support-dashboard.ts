"use client";

import { endpoints } from "@/lib/endpoints";
import { useApiQuery } from "../use-api-query";

export interface CustomerSegmentation {
  newCustomers: number;
  returningCustomers: number;
  newCustomerPercentage: number;
  returningCustomerPercentage: number;
}

export interface CustomerRetention {
  repeatPurchaseRate: number;
  averageClv: number;
  customersWithMultipleOrders: number;
}

export interface SupportMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  firstResponseSla: number;
}

export interface ReturnReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface ComplaintTrend {
  productId: string;
  productTitle: string;
  complaintCount: number;
  complaintRate: number;
}

export interface ReviewSentiment {
  averageRating: number;
  totalReviews: number;
  positiveReviews: number;
  negativeReviews: number;
  neutralReviews: number;
  nps: number;
}

export interface CustomerSupportDashboard {
  segmentation: CustomerSegmentation;
  retention: CustomerRetention;
  support: SupportMetrics;
  returnReasons: ReturnReason[];
  complaintTrends: ComplaintTrend[];
  reviewSentiment: ReviewSentiment;
}

export function useCustomerSupportDashboard() {
  return useApiQuery<CustomerSupportDashboard>(
    endpoints.dashboards.customerSupport,
    {
      refetchInterval: 60000, // Refresh every minute
    },
  );
}
