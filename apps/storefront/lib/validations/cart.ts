import { z } from "zod";

/**
 * Cart validation schemas matching backend DTOs
 */

export const bundleVariantBreakdownSchema = z.object({
  variantId: z.string().uuid(),
  unitPrice: z.number(),
  quantity: z.number(),
});

export const cartItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["variant", "bundle"]),
  productVariantId: z.string().uuid(),
  bundleId: z.string().uuid().optional(),
  selections: z.record(z.string(), z.array(z.string())).optional(),
  quantity: z.number(),
  price: z.number(),
  unitBundlePrice: z.number().optional(),
  bundleVariantBreakdown: z.array(bundleVariantBreakdownSchema).optional(),
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

export const cartSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid().nullable(),
  sessionId: z.string().nullable(),
  subtotal: z.number(),
  gstAmount: z.number(),
  discountCode: z.string().nullable(),
  discountAmount: z.number(),
  gstBreakdown: gstBreakdownSchema,
  total: z.number(),
  items: z.array(cartItemSchema),
  expiresAt: z.string().datetime().or(z.date()).nullable(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export type Cart = z.infer<typeof cartSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type GstBreakdown = z.infer<typeof gstBreakdownSchema>;
