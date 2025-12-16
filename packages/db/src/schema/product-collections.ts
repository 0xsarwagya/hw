import { relations } from "drizzle-orm";
import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { collections } from "./collections";
import { products } from "./products";

/**
 * Product to Collections (many-to-many)
 * Junction table for products and collections
 */
export const productCollections = pgTable(
  "product_collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("product_collections_product_id_idx").on(
      table.productId,
    ),
    collectionIdIdx: index("product_collections_collection_id_idx").on(
      table.collectionId,
    ),
    uniqueProductCollection: index("product_collections_unique_idx").on(
      table.productId,
      table.collectionId,
    ),
  }),
);

export const productCollectionsRelations = relations(
  productCollections,
  ({ one }) => ({
    product: one(products, {
      fields: [productCollections.productId],
      references: [products.id],
    }),
    collection: one(collections, {
      fields: [productCollections.collectionId],
      references: [collections.id],
    }),
  }),
);

export type ProductCollection = typeof productCollections.$inferSelect;
export type NewProductCollection = typeof productCollections.$inferInsert;

