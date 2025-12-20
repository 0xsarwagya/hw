import { integer, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Inventory settings table
 * Stores global and per-variant low stock thresholds
 * Singleton pattern - single row table
 */
export const inventorySettings = pgTable("inventory_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  globalLowStockThreshold: integer("global_low_stock_threshold")
    .notNull()
    .default(5), // Default threshold
  perVariantOverrides: jsonb("per_variant_overrides").$type<
    Record<string, number>
  >(), // Map of variantId -> threshold
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, {
    onDelete: "set null",
  }), // Admin who last updated settings
});

export type InventorySettings = typeof inventorySettings.$inferSelect;
export type NewInventorySettings = typeof inventorySettings.$inferInsert;
