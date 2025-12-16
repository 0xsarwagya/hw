import { relations } from "drizzle-orm";
import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { products } from "./products";
import { tags } from "./tags";

/**
 * Product to Tags (many-to-many)
 * Junction table for products and tags
 */
export const productTags = pgTable(
  "product_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("product_tags_product_id_idx").on(table.productId),
    tagIdIdx: index("product_tags_tag_id_idx").on(table.tagId),
    uniqueProductTag: index("product_tags_unique_idx").on(
      table.productId,
      table.tagId,
    ),
  }),
);

export const productTagsRelations = relations(productTags, ({ one }) => ({
  product: one(products, {
    fields: [productTags.productId],
    references: [products.id],
  }),
  tag: one(tags, {
    fields: [productTags.tagId],
    references: [tags.id],
  }),
}));

export type ProductTag = typeof productTags.$inferSelect;
export type NewProductTag = typeof productTags.$inferInsert;
