import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { productImages } from "./product-images";
import { productVariants } from "./product-variants";
import { products } from "./products";

/**
 * Media audit action types
 */
export const mediaAuditActionEnum = pgEnum("media_audit_action", [
  "delete",
  "reorder_fix",
  "orphan_cleanup",
  "inherit_fix",
  "s3_cleanup",
  "order_reset",
]);

/**
 * Media audit logs table
 * Stores immutable audit trail of all media consistency operations
 */
export const mediaAuditLogs = pgTable(
  "media_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    imageId: uuid("image_id").references(() => productImages.id, {
      onDelete: "set null",
    }),
    action: mediaAuditActionEnum("action").notNull(),
    details: jsonb("details"), // JSON object for flexible metadata storage
    performedBy: text("performed_by").notNull(), // "system" or admin user ID
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("media_audit_logs_product_id_idx").on(table.productId),
    variantIdIdx: index("media_audit_logs_variant_id_idx").on(table.variantId),
    imageIdIdx: index("media_audit_logs_image_id_idx").on(table.imageId),
    actionIdx: index("media_audit_logs_action_idx").on(table.action),
    createdAtIdx: index("media_audit_logs_created_at_idx").on(table.createdAt),
  }),
);

export const mediaAuditLogsRelations = relations(mediaAuditLogs, ({ one }) => ({
  product: one(products, {
    fields: [mediaAuditLogs.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [mediaAuditLogs.variantId],
    references: [productVariants.id],
  }),
  image: one(productImages, {
    fields: [mediaAuditLogs.imageId],
    references: [productImages.id],
  }),
}));

export type MediaAuditLog = typeof mediaAuditLogs.$inferSelect;
export type NewMediaAuditLog = typeof mediaAuditLogs.$inferInsert;
