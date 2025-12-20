import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const orderNotes = pgTable(
  "order_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    note: text("note").notNull(),
    isPublic: boolean("is_public").notNull().default(false),
    authorId: uuid("author_id"), // Admin user ID (nullable for system-generated notes)
    authorName: text("author_name"), // Cached author name for display
    authorEmail: text("author_email"), // Cached author email for display
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index("order_notes_order_id_idx").on(table.orderId),
    isPublicIdx: index("order_notes_is_public_idx").on(table.isPublic),
    createdAtIdx: index("order_notes_created_at_idx").on(table.createdAt),
  }),
);

export const orderNotesRelations = relations(orderNotes, ({ one }) => ({
  order: one(orders, {
    fields: [orderNotes.orderId],
    references: [orders.id],
  }),
}));

export type OrderNote = typeof orderNotes.$inferSelect;
export type NewOrderNote = typeof orderNotes.$inferInsert;
