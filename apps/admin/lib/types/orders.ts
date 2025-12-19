/**
 * Order-related TypeScript types
 * Mapped from backend DTOs
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus =
  | "pending"
  | "initiated"
  | "completed"
  | "failed"
  | "refunded";

export type FulfillmentStatus =
  | "unfulfilled"
  | "partially_fulfilled"
  | "fulfilled"
  | "shipped"
  | "delivered";

export interface GSTBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  isIntraState: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productVariantId: string;
  quantity: number;
  price: number;
  gstRate: number;
  gstAmount: number;
  createdAt: Date;
  updatedAt: Date;
  // Extended fields (may come from product lookup)
  productTitle?: string;
  variantTitle?: string;
  thumbnail?: string;
  // Bundle fields
  bundleId?: string;
  bundleTitle?: string;
  bundleVariantBreakdown?: Array<{
    variantId: string;
    unitPrice: number;
    quantity: number;
  }>;
}

export interface Order {
  id: string;
  customerId: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  gstAmount: number;
  gstBreakdown: GSTBreakdown;
  shippingCost: number;
  total: number;
  razorpayOrderId: string | null;
  shippingProvider: string | null;
  shippingAddressId: string;
  billingAddressId: string;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
  // Extended fields (may come from customer/address lookup)
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  landmark?: string | null;
  type: "shipping" | "billing";
}

export interface PaginatedOrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  minValue?: number;
  maxValue?: number;
}

export type TimelineEventType =
  | "order_created"
  | "status_changed"
  | "payment_initiated"
  | "payment_completed"
  | "payment_failed"
  | "shipment_created"
  | "shipment_label_generated"
  | "shipment_picked_up"
  | "shipment_in_transit"
  | "shipment_out_for_delivery"
  | "shipment_delivered"
  | "shipment_failed"
  | "shipment_returned";

export interface TimelineEvent {
  type: TimelineEventType;
  title: string;
  description: string;
  previousValue?: string | null;
  newValue?: string | null;
  timestamp: Date;
  metadata?: Record<string, unknown> | null;
}

export interface OrderTimeline {
  orderId: string;
  orderNumber: string;
  currentStatus: OrderStatus;
  events: TimelineEvent[];
}
