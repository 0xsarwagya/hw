import { z } from "zod";

export const createVariantOptionTypeSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must not exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
});

export const createProductVariantOptionTypeSchema = z.object({
  optionTypeId: z
    .string()
    .uuid("Option type ID must be a valid UUID")
    .optional(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must not exceed 100 characters"),
  displayOrder: z.number().int().min(0).optional(),
});

export const createVariantOptionValueSchema = z.object({
  value: z
    .string()
    .min(1, "Value is required")
    .max(100, "Value must not exceed 100 characters"),
  displayOrder: z.number().int().min(0).optional(),
});

export type CreateVariantOptionTypeInput = z.infer<
  typeof createVariantOptionTypeSchema
>;
export type CreateProductVariantOptionTypeInput = z.infer<
  typeof createProductVariantOptionTypeSchema
>;
export type CreateVariantOptionValueInput = z.infer<
  typeof createVariantOptionValueSchema
>;
