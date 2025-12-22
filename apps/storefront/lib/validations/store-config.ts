import { z } from "zod";

/**
 * Store configuration validation schemas matching backend DTOs
 */

export const storeConfigSchema = z.object({
  currency: z.string(),
  name: z.string(),
  domain: z.string(),
  primaryColor: z.string().nullable(),
  logoUrl: z.string().nullable(),
  features: z.object({
    guestCheckout: z.boolean(),
    cod: z.boolean(),
    multiCurrency: z.boolean(),
  }),
});

export type StoreConfig = z.infer<typeof storeConfigSchema>;
