import { z } from "zod";

/**
 * Address validation schemas matching backend DTOs
 */

export const addressSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  type: z.enum(["shipping", "billing", "both"]),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string().regex(/^\d{6}$/),
  district: z.string().nullable(),
  country: z.string(),
  isDefault: z.boolean(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export const createAddressSchema = z.object({
  type: z.enum(["shipping", "billing", "both"]).default("shipping"),
  street: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().regex(/^\d{6}$/),
  district: z.string().max(100).optional(),
  country: z.string().max(100).default("India"),
});

export const updateAddressSchema = createAddressSchema.partial();

export type Address = z.infer<typeof addressSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
