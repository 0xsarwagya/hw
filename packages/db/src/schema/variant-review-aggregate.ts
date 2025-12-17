import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  real,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { productVariants } from "./product-variants";

export const variantReviewAggregate = pgTable(
  "variant_review_aggregate",
  {
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" })
      .primaryKey(),
    averageRating: real("average_rating").notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    rating1Count: integer("rating_1_count").notNull().default(0),
    rating2Count: integer("rating_2_count").notNull().default(0),
    rating3Count: integer("rating_3_count").notNull().default(0),
    rating4Count: integer("rating_4_count").notNull().default(0),
    rating5Count: integer("rating_5_count").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    variantIdIdx: index("variant_review_aggregate_variant_id_idx").on(
      table.variantId,
    ),
  }),
);

export const variantReviewAggregateRelations = relations(
  variantReviewAggregate,
  ({ one }) => ({
    variant: one(productVariants, {
      fields: [variantReviewAggregate.variantId],
      references: [productVariants.id],
    }),
  }),
);

export type VariantReviewAggregate = typeof variantReviewAggregate.$inferSelect;
export type NewVariantReviewAggregate =
  typeof variantReviewAggregate.$inferInsert;
