import { z } from "zod";

/**
 * Collection validation schemas matching backend DTOs
 */

export const collectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  createdAt: z.string().datetime().or(z.date()),
  updatedAt: z.string().datetime().or(z.date()),
  productCount: z.number().optional(),
});

export type Collection = z.infer<typeof collectionSchema>;
