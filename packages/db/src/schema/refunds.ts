import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const refundStatusEnum = pgEnum("refund_status", [
  "pending",
  "completed",
  "failed",
]);

export const refunds = pgTable(
  "refunds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    amount: real("amount").notNull(),
    reason: text("reason").notNull(),
    status: refundStatusEnum("status").notNull().default("pending"),
    providerRefundId: text("provider_refund_id"), // External provider refund ID (e.g., Razorpay refund ID)
    processedAt: timestamp("processed_at"), // When refund was actually processed
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index("refunds_order_id_idx").on(table.orderId),
    statusIdx: index("refunds_status_idx").on(table.status),
    createdAtIdx: index("refunds_created_at_idx").on(table.createdAt),
    providerRefundIdIdx: index("refunds_provider_refund_id_idx").on(
      table.providerRefundId,
    ),
  }),
);

export const refundsRelations = relations(refunds, ({ one }) => ({
  order: one(orders, {
    fields: [refunds.orderId],
    references: [orders.id],
  }),
}));

export type Refund = typeof refunds.$inferSelect;
export type NewRefund = typeof refunds.$inferInsert;

