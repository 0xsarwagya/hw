import { z } from "zod";

export const createShippingMethodSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  description: z.string().optional(),
  code: z
    .string()
    .min(1, "Code is required")
    .max(100, "Code is too long")
    .regex(
      /^[a-z0-9_-]+$/,
      "Code must be lowercase alphanumeric with hyphens/underscores",
    ),
  baseRate: z.number().min(0, "Base rate must be non-negative"),
  estimatedDays: z.number().int().min(1, "Estimated days must be at least 1"),
  codAvailable: z.boolean().optional().default(true),
  codCharge: z.number().min(0, "COD charge must be non-negative").optional(),
  isActive: z.boolean().optional().default(true),
  priority: z.number().int().optional().default(0),
  minOrderValue: z.number().int().min(0).optional(),
  maxOrderValue: z.number().int().min(0).optional(),
  restrictedZones: z.array(z.string()).optional(),
  restrictedStates: z.array(z.string()).optional(),
});

export const updateShippingMethodSchema = createShippingMethodSchema.partial();

export type CreateShippingMethodInputSchema = z.infer<
  typeof createShippingMethodSchema
>;
export type UpdateShippingMethodInputSchema = z.infer<
  typeof updateShippingMethodSchema
>;
