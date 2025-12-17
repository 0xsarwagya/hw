import { relations } from "drizzle-orm";
import { index, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { bundleSets } from "./bundle-sets";
import { productVariants } from "./product-variants";

export const bundleSetItems = pgTable(
  "bundle_set_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    setId: uuid("set_id")
      .notNull()
      .references(() => bundleSets.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    setIdIdx: index("bundle_set_items_set_id_idx").on(table.setId),
    variantIdIdx: index("bundle_set_items_variant_id_idx").on(table.variantId),
    setIdVariantIdUnique: unique(
      "bundle_set_items_set_id_variant_id_unique",
    ).on(table.setId, table.variantId),
  }),
);

export const bundleSetItemsRelations = relations(bundleSetItems, ({ one }) => ({
  set: one(bundleSets, {
    fields: [bundleSetItems.setId],
    references: [bundleSets.id],
  }),
  variant: one(productVariants, {
    fields: [bundleSetItems.variantId],
    references: [productVariants.id],
  }),
}));

export type BundleSetItem = typeof bundleSetItems.$inferSelect;
export type NewBundleSetItem = typeof bundleSetItems.$inferInsert;
