/**
 * Status constants for products, orders, payments, and reviews
 * Centralizes all status values and their display labels
 */

import type {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
} from "@/lib/types/orders";
import type { ProductStatus } from "@/lib/types/products";
import type { ReviewStatus } from "@/lib/types/reviews";

// Product Statuses
export const PRODUCT_STATUSES = {
  DRAFT: "draft" as const,
  ACTIVE: "active" as const,
  ARCHIVED: "archived" as const,
} as const;

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

// Order Statuses
export const ORDER_STATUSES = {
  PENDING: "pending" as const,
  CONFIRMED: "confirmed" as const,
  PROCESSING: "processing" as const,
  SHIPPED: "shipped" as const,
  DELIVERED: "delivered" as const,
  CANCELLED: "cancelled" as const,
  REFUNDED: "refunded" as const,
} as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

// Payment Statuses
export const PAYMENT_STATUSES = {
  PENDING: "pending" as const,
  INITIATED: "initiated" as const,
  COMPLETED: "completed" as const,
  FAILED: "failed" as const,
  REFUNDED: "refunded" as const,
} as const;

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  initiated: "Initiated",
  completed: "Completed",
  failed: "Failed",
  refunded: "Refunded",
};

// Fulfillment Statuses
export const FULFILLMENT_STATUSES = {
  UNFULFILLED: "unfulfilled" as const,
  PARTIALLY_FULFILLED: "partially_fulfilled" as const,
  FULFILLED: "fulfilled" as const,
  SHIPPED: "shipped" as const,
  DELIVERED: "delivered" as const,
} as const;

export const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
  unfulfilled: "Unfulfilled",
  partially_fulfilled: "Partially Fulfilled",
  fulfilled: "Fulfilled",
  shipped: "Shipped",
  delivered: "Delivered",
};

// Review Statuses
export const REVIEW_STATUSES = {
  PENDING: "pending" as const,
  APPROVED: "approved" as const,
  REJECTED: "rejected" as const,
} as const;

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

// Status Variant Mapping (for Badge components)
export const STATUS_VARIANTS: Record<
  ProductStatus | OrderStatus | PaymentStatus | ReviewStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  // Product statuses
  draft: "outline",
  active: "default",
  archived: "secondary",
  // Order statuses
  pending: "outline",
  confirmed: "default",
  processing: "default",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  refunded: "destructive",
  // Payment statuses
  initiated: "default",
  completed: "default",
  failed: "destructive",
  // Review statuses
  approved: "default",
  rejected: "destructive",
};
