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
import { productCollections } from "./product-collections";

export const collectionTypeEnum = pgEnum("collection_type", [
  "manual",
  "automatic",
]);

export const collectionMatchTypeEnum = pgEnum("collection_match_type", [
  "all",
  "any",
]);

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    imageUrl: text("image_url"),
    type: collectionTypeEnum("type").notNull().default("manual"),
    rules:
      jsonb("rules").$type<
        Array<{
          field: string;
          operator: string;
          value: string | number;
        }>
      >(),
    matchType: collectionMatchTypeEnum("match_type").default("all"),
    position: integer("position").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("collections_slug_idx").on(table.slug),
    typeIdx: index("collections_type_idx").on(table.type),
    positionIdx: index("collections_position_idx").on(table.position),
  }),
);

export const collectionsRelations = relations(collections, ({ many }) => ({
  products: many(productCollections),
}));

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
