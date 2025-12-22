import { z } from "zod";

/**
 * Category validation schemas matching backend DTOs
 */

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  parentId: z.string().uuid().nullable(),
  imageUrl: z.string().url().nullable(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
});

export const categoryTreeSchema: z.ZodType<
  Category & { children?: CategoryTree[] }
> = categorySchema.extend({
  children: z.lazy(() => z.array(categoryTreeSchema)).optional(),
});

export type Category = z.infer<typeof categorySchema>;
export type CategoryTree = z.infer<typeof categoryTreeSchema>;
