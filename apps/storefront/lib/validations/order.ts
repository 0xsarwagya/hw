import { z } from "zod";

/**
 * Order validation schemas matching backend DTOs
 */

export const orderItemSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  productVariantId: z.string().uuid(),
  productTitle: z.string(),
  variantTitle: z.string().nullable(),
  sku: z.string().nullable(),
  quantity: z.number(),
  price: z.number(),
  gstRate: z.number(),
  gstAmount: z.number(),
  total: z.number(),
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

export const paymentFeeBreakdownSchema = z
  .object({
    method: z.string(),
    chargeType: z.string(),
    calculatedFee: z.number(),
    flatAmount: z.number().optional(),
    percentage: z.number().optional(),
    mixMin: z.number().optional(),
    mixCap: z.number().optional(),
  })
  .nullable()
  .optional();

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
  paymentFeeBreakdown: paymentFeeBreakdownSchema,
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
});

export const orderTimelineSchema = z.object({
  orderId: z.string().uuid(),
  events: z.array(
    z.object({
      id: z.string().uuid(),
      type: z.string(),
      status: z.string().optional(),
      description: z.string(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      createdAt: z.string().datetime().or(z.date()),
    }),
  ),
});

export const orderTrackingSchema = z.object({
  orderId: z.string().uuid(),
  trackingNumber: z.string().nullable(),
  carrier: z.string().nullable(),
  status: z.string().nullable(),
  estimatedDelivery: z.string().datetime().or(z.date()).nullable(),
  trackingUrl: z.string().url().nullable(),
});

export type Order = z.infer<typeof orderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type OrderTimeline = z.infer<typeof orderTimelineSchema>;
export type OrderTracking = z.infer<typeof orderTrackingSchema>;
