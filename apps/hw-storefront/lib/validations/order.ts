import { z } from "zod";

/**
 * Order validation schemas matching backend DTOs
 */

export const orderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productVariantId: z.string().uuid(),
  quantity: z.number(),
  price: z.number(),
  gstRate: z.number(),
  gstAmount: z.number(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export const gstBreakdownSchema = z.object({
  cgst: z.number(),
  sgst: z.number(),
  igst: z.number(),
  totalGst: z.number(),
  isIntraState: z.boolean(),
});

export const paymentFeeBreakdownSchema = z.object({
  method: z.string(),
  chargeType: z.string(),
  calculatedFee: z.number(),
  flatAmount: z.number().optional(),
  percentage: z.number().optional(),
  mixMin: z.number().optional(),
  mixCap: z.number().optional(),
});

export const orderSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  orderNumber: z.string(),
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  subtotal: z.number(),
  gstAmount: z.number(),
  gstBreakdown: gstBreakdownSchema,
  shippingCost: z.number(),
  paymentFee: z.number().optional(),
  paymentMethod: z.string().nullable().optional(),
  paymentFeeBreakdown: paymentFeeBreakdownSchema.nullable().optional(),
  total: z.number(),
  razorpayOrderId: z.string().nullable(),
  shippingProvider: z.string().nullable(),
  shippingAddressId: z.string().uuid(),
  billingAddressId: z.string().uuid(),
  items: z.array(orderItemSchema),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
  archived: z.boolean().optional(),
  archivedAt: z.string().datetime().or(z.date()).nullable().optional(),
  archivedBy: z.string().uuid().nullable().optional(),
});

export const timelineEventTypeSchema = z.enum([
  "order_created",
  "order_confirmed",
  "order_processing",
  "order_shipped",
  "order_delivered",
  "order_cancelled",
  "status_changed",
  "payment_intent_created",
  "payment_initiated",
  "payment_completed",
  "payment_failed",
  "order_marked_paid",
  "cart_snapshot",
  "inventory_reserved",
  "shipment_created",
  "shipment_tracking_updated",
  "shipment_label_generated",
  "shipment_picked_up",
  "shipment_in_transit",
  "shipment_out_for_delivery",
  "shipment_delivered",
  "shipment_failed",
  "shipment_returned",
  "shipment_cancelled",
  "note_added",
  "admin_note_added",
  "address_updated",
  "refund_created",
  "refund_processed",
  "rate_limit_triggered",
  "checkout_merged",
  "guest_checkout_detected",
  "abandoned_checkout_recovered",
]);

export const timelineEventSchema = z.object({
  type: timelineEventTypeSchema,
  title: z.string(),
  description: z.string(),
  previousValue: z.string().nullable().optional(),
  newValue: z.string().nullable().optional(),
  timestamp: z.string().datetime().or(z.date()),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  actor: z.enum(["system", "admin", "customer", "automated"]).optional(),
  actorId: z.string().uuid().optional(),
  actorName: z.string().optional(),
  actorEmail: z.string().email().optional(),
  traceId: z.string().optional(),
  spanId: z.string().optional(),
  requestId: z.string().optional(),
});

export const orderTimelineSchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.string(),
  currentStatus: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  events: z.array(timelineEventSchema),
});

export const shipmentTrackingSchema = z.object({
  id: z.string().uuid(),
  provider: z.string(),
  trackingNumber: z.string().nullable(),
  status: z.enum([
    "pending",
    "label_generated",
    "picked_up",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "failed",
    "returned",
    "cancelled",
  ]),
  labelUrl: z.string().nullable(),
  awbNumber: z.string().nullable(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export const orderTrackingSchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.string(),
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  shippingProvider: z.string().nullable(),
  shipments: z.array(shipmentTrackingSchema),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export type OrderItem = z.infer<typeof orderItemSchema>;
export type Order = z.infer<typeof orderSchema>;
export type PaymentFeeBreakdown = z.infer<typeof paymentFeeBreakdownSchema>;
export type TimelineEvent = z.infer<typeof timelineEventSchema>;
export type OrderTimeline = z.infer<typeof orderTimelineSchema>;
export type ShipmentTracking = z.infer<typeof shipmentTrackingSchema>;
export type OrderTracking = z.infer<typeof orderTrackingSchema>;
