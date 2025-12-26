import { z } from "zod";

/**
 * Cart validation schemas matching backend DTOs
 */

// UserBundleSelection: { [setId: string]: string[] }
export const userBundleSelectionSchema = z.record(
  z.string(),
  z.array(z.string()),
);

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
  selections: userBundleSelectionSchema.optional(),
  quantity: z.number(),
  price: z.number(),
  unitBundlePrice: z.number().optional(),
  bundleVariantBreakdown: z.array(bundleVariantBreakdownSchema).optional(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export const cartGstBreakdownSchema = z.object({
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
  gstBreakdown: cartGstBreakdownSchema,
  total: z.number(),
  items: z.array(cartItemSchema),
  expiresAt: z.string().datetime().or(z.date()).nullable(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;
export type UserBundleSelection = z.infer<typeof userBundleSelectionSchema>;
export type BundleVariantBreakdown = z.infer<
  typeof bundleVariantBreakdownSchema
>;
export type CartGstBreakdown = z.infer<typeof cartGstBreakdownSchema>;
