import { z } from "zod";

export const addCartItemSchema = z.object({
  cartId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().min(1).max(10),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().min(1).max(10),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1).max(50),
});
