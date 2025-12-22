import { z } from "zod";

/**
 * Discount validation schemas matching backend DTOs
 */

export const validateDiscountSchema = z.object({
  code: z.string().min(1),
  orderAmount: z.number().min(0).optional(),
});

export const discountValidationResponseSchema = z.object({
  valid: z.boolean(),
  discount: z
    .object({
      id: z.string().uuid(),
      code: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      type: z.string(),
      value: z.number(),
      minOrderAmount: z.number().nullable(),
      maxDiscountAmount: z.number().nullable(),
    })
    .nullable()
    .optional(),
  message: z.string().optional(),
  discountAmount: z.number().optional(),
});

export type ValidateDiscountInput = z.infer<typeof validateDiscountSchema>;
export type DiscountValidationResponse = z.infer<
  typeof discountValidationResponseSchema
>;
