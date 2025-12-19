/**
 * Format utility functions
 * Centralized formatting functions for currency, dates, and status
 */

import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PRODUCT_STATUS_LABELS,
  REVIEW_STATUS_LABELS,
} from "@/lib/constants/status.constants";
import type { OrderStatus, PaymentStatus } from "@/lib/types/orders";
import type { ProductStatus } from "@/lib/types/products";
import type { ReviewStatus } from "@/lib/types/reviews";

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = "INR",
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date to readable string
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return new Intl.DateTimeFormat("en-US", {
    ...defaultOptions,
    ...options,
  }).format(dateObj);
}

/**
 * Format date and time
 */
export function formatDateTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Intl.DateTimeFormat("en-US", {
    ...defaultOptions,
    ...options,
  }).format(dateObj);
}

/**
 * Format status to display label
 */
export function formatStatus(
  status: ProductStatus | OrderStatus | PaymentStatus | ReviewStatus | string,
): string {
  if (status in PRODUCT_STATUS_LABELS) {
    return PRODUCT_STATUS_LABELS[status as ProductStatus];
  }
  if (status in ORDER_STATUS_LABELS) {
    return ORDER_STATUS_LABELS[status as OrderStatus];
  }
  if (status in PAYMENT_STATUS_LABELS) {
    return PAYMENT_STATUS_LABELS[status as PaymentStatus];
  }
  if (status in REVIEW_STATUS_LABELS) {
    return REVIEW_STATUS_LABELS[status as ReviewStatus];
  }
  // Fallback: capitalize first letter
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}
