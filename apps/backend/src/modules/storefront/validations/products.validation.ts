import { z } from "zod";

export const queryProductsSchema = z.object({
  search: z.string().max(120).optional(),
  categoryId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  inStockOnly: z.boolean().optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "oldest"]).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

export const productIdSchema = z.object({
  id: z.string().uuid(),
});
