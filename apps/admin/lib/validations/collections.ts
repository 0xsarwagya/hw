import * as z from "zod";

export const collectionRuleSchema = z.object({
  field: z.enum(["price", "title", "tags", "category", "status", "inventory"]),
  operator: z.enum([
    "equals",
    "not_equals",
    "less_than",
    "greater_than",
    "contains",
  ]),
  value: z.union([z.string(), z.number()]),
});

export const createCollectionSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters"),
  slug: z.string().max(255, "Slug must not exceed 255 characters").optional(),
  description: z
    .string()
    .max(5000, "Description must not exceed 5000 characters")
    .optional(),
  imageUrl: z
    .string()
    .max(500, "Image URL must not exceed 500 characters")
    .optional(),
  type: z.enum(["manual", "automatic"]).optional(),
  rules: z.array(collectionRuleSchema).optional(),
  matchType: z.enum(["all", "any"]).optional(),
  position: z.number().int().optional(),
});

export const updateCollectionSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters")
    .optional(),
  slug: z.string().max(255, "Slug must not exceed 255 characters").optional(),
  description: z
    .string()
    .max(5000, "Description must not exceed 5000 characters")
    .optional(),
  imageUrl: z
    .string()
    .max(500, "Image URL must not exceed 500 characters")
    .optional(),
  type: z.enum(["manual", "automatic"]).optional(),
  rules: z.array(collectionRuleSchema).optional(),
  matchType: z.enum(["all", "any"]).optional(),
  position: z.number().int().optional(),
});

export const addProductsToCollectionSchema = z.object({
  productIds: z
    .array(z.string().uuid("Product ID must be a valid UUID"))
    .min(1, "At least one product ID is required"),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type AddProductsToCollectionInput = z.infer<
  typeof addProductsToCollectionSchema
>;
