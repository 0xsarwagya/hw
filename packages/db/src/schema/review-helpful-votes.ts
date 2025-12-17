import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { reviews } from "./reviews";

export const reviewHelpfulVotes = pgTable(
  "review_helpful_votes",
  {
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.customerId, table.reviewId] }),
    customerIdIdx: index("review_helpful_votes_customer_id_idx").on(
      table.customerId,
    ),
    reviewIdIdx: index("review_helpful_votes_review_id_idx").on(table.reviewId),
  }),
);

export const reviewHelpfulVotesRelations = relations(
  reviewHelpfulVotes,
  ({ one }) => ({
    customer: one(customers, {
      fields: [reviewHelpfulVotes.customerId],
      references: [customers.id],
    }),
    review: one(reviews, {
      fields: [reviewHelpfulVotes.reviewId],
      references: [reviews.id],
    }),
  }),
);

export type ReviewHelpfulVote = typeof reviewHelpfulVotes.$inferSelect;
export type NewReviewHelpfulVote = typeof reviewHelpfulVotes.$inferInsert;
