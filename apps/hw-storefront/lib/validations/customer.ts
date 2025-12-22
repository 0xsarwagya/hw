import { z } from "zod";

/**
 * Customer validation schemas matching backend DTOs
 */

export const customerProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  gstin: z.string().nullable(),
  customerGroupId: z.string().uuid().nullable(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

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
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/),
  district: z.string().optional(),
  country: z.string().default("India"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  gstin: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const claimAccountSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export type CustomerProfile = z.infer<typeof customerProfileSchema>;
export type Address = z.infer<typeof addressSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ClaimAccountInput = z.infer<typeof claimAccountSchema>;
