import { z } from "zod";

export const startCheckoutSchema = z.object({
  cartId: z.string().uuid(),
  guestEmail: z.string().email().optional(),
});

export const checkoutAddressSchema = z.object({
  checkoutSessionId: z.string().uuid(),
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  address1: z.string().min(1).max(255),
  address2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z
    .string()
    .length(6)
    .regex(/^\d{6}$/),
  country: z.string().max(100).default("India"),
});

export const checkoutShippingSchema = z.object({
  checkoutSessionId: z.string().uuid(),
  shippingMethodId: z.string().uuid(),
});

export const checkoutConfirmSchema = z.object({
  checkoutSessionId: z.string().uuid(),
  idempotencyKey: z.string().optional(),
});
