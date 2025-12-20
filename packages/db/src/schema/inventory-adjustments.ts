import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { productVariants } from "./product-variants";
import { users } from "./users";

/**
 * Inventory adjustment type enum
 */
export const inventoryAdjustmentTypeEnum = pgEnum("inventory_adjustment_type", [
  "increase",
  "decrease",
  "set",
]);

/**
 * Inventory adjustment reason enum
 */
export const inventoryAdjustmentReasonEnum = pgEnum(
  "inventory_adjustment_reason",
  [
    "received",
    "correction",
    "damaged",
    "lost",
    "returned",
    "giveaway",
    "manual",
  ],
);

/**
 * Inventory adjustments table
 * Stores all manual inventory adjustments with full audit trail
 */
export const inventoryAdjustments = pgTable(
  "inventory_adjustments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    oldQuantity: integer("old_quantity").notNull(),
    newQuantity: integer("new_quantity").notNull(),
    delta: integer("delta").notNull(), // Positive for increase, negative for decrease
    type: inventoryAdjustmentTypeEnum("type").notNull(),
    reason: inventoryAdjustmentReasonEnum("reason").notNull(),
    note: text("note"), // Optional note from admin
    actorAdminId: uuid("actor_admin_id")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }), // Keep logs even if admin is deleted
    metadata: jsonb("metadata").$type<{
      orderId?: string;
      refundId?: string;
      [key: string]: unknown;
    }>(), // Flexible metadata for order/refund tracking
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    variantIdIdx: index("inventory_adjustments_variant_id_idx").on(
      table.variantId,
    ),
    createdAtIdx: index("inventory_adjustments_created_at_idx").on(
      table.createdAt,
    ),
    actorAdminIdIdx: index("inventory_adjustments_actor_admin_id_idx").on(
      table.actorAdminId,
    ),
    typeIdx: index("inventory_adjustments_type_idx").on(table.type),
    reasonIdx: index("inventory_adjustments_reason_idx").on(table.reason),
  }),
);

export const inventoryAdjustmentsRelations = relations(
  inventoryAdjustments,
  ({ one }) => ({
    variant: one(productVariants, {
      fields: [inventoryAdjustments.variantId],
      references: [productVariants.id],
    }),
    actor: one(users, {
      fields: [inventoryAdjustments.actorAdminId],
      references: [users.id],
    }),
  }),
);

export type InventoryAdjustment = typeof inventoryAdjustments.$inferSelect;
export type NewInventoryAdjustment = typeof inventoryAdjustments.$inferInsert;
