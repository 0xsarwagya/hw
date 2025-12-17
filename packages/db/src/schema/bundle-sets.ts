import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { bundleSetItems } from "./bundle-set-items";
import { bundles } from "./bundles";

export const bundleSets = pgTable(
  "bundle_sets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bundleId: uuid("bundle_id")
      .notNull()
      .references(() => bundles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    minQuantity: integer("min_quantity").notNull().default(0),
    maxQuantity: integer("max_quantity").notNull().default(1),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    bundleIdIdx: index("bundle_sets_bundle_id_idx").on(table.bundleId),
    sortOrderIdx: index("bundle_sets_sort_order_idx").on(table.sortOrder),
  }),
);

export const bundleSetsRelations = relations(bundleSets, ({ one, many }) => ({
  bundle: one(bundles, {
    fields: [bundleSets.bundleId],
    references: [bundles.id],
  }),
  items: many(bundleSetItems),
}));

export type BundleSet = typeof bundleSets.$inferSelect;
export type NewBundleSet = typeof bundleSets.$inferInsert;
