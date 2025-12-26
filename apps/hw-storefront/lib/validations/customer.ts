import { z } from "zod";

/**
 * Customer validation schemas matching backend DTOs
 */

export const customerProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  email: z.string().email(),
  phone: z.string(),
  name: z.string(),
  gstin: z.string().nullable(),
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
  pincode: z.string(),
  district: z.string().nullable(),
  country: z.string(),
  isDefault: z.boolean(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export const updateProfileSchema = z.object({
  name: z.string().max(255).optional(),
  phone: z
    .string()
    .regex(
      /^[6-9]\d{9}$/,
      "Phone must be a valid 10-digit Indian mobile number",
    )
    .optional(),
  gstin: z.string().length(15).optional(), // GSTIN validation can be enhanced later
});

export type CustomerProfile = z.infer<typeof customerProfileSchema>;
export type Address = z.infer<typeof addressSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
