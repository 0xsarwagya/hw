import { z } from "zod";

export const orderIdSchema = z.object({
  id: z.string().uuid(),
});

export const orderStatusFilterSchema = z.object({
  status: z
    .enum([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ])
    .optional(),
});
