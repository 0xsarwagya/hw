import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { orders } from "./orders";
import { productVariants } from "./product-variants";

export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "approved",
  "rejected",
]);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1-5
    title: text("title"),
    body: text("body").notNull(),
    images: jsonb("images").$type<string[]>(), // Array of image URLs, max 5
    status: reviewStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    customerIdIdx: index("reviews_customer_id_idx").on(table.customerId),
    orderIdIdx: index("reviews_order_id_idx").on(table.orderId),
    variantIdIdx: index("reviews_variant_id_idx").on(table.variantId),
    statusIdx: index("reviews_status_idx").on(table.status),
    // Unique constraint: one review per customer per variant
    customerVariantUnique: unique("reviews_customer_variant_unique").on(
      table.customerId,
      table.variantId,
    ),
  }),
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  customer: one(customers, {
    fields: [reviews.customerId],
    references: [customers.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
  variant: one(productVariants, {
    fields: [reviews.variantId],
    references: [productVariants.id],
  }),
}));

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
