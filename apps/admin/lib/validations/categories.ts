import * as z from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters"),
  slug: z.string().max(255, "Slug must not exceed 255 characters").optional(),
  parentId: z.string().uuid("Parent ID must be a valid UUID").optional(),
  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),
  imageUrl: z
    .string()
    .max(500, "Image URL must not exceed 500 characters")
    .optional(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must not exceed 255 characters")
    .optional(),
  slug: z.string().max(255, "Slug must not exceed 255 characters").optional(),
  parentId: z
    .string()
    .uuid("Parent ID must be a valid UUID")
    .optional()
    .nullable(),
  description: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),
  imageUrl: z
    .string()
    .max(500, "Image URL must not exceed 500 characters")
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
