import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const adminActivityLogs = pgTable(
  "admin_activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => users.id, { onDelete: "set null" }), // Keep logs even if admin is deleted
    action: text("action").notNull(), // e.g., "product.create", "discount.update"
    entityId: text("entity_id"), // Optional: ID of the entity affected (e.g., productId, discountId)
    metadata: jsonb("metadata"), // Optional: additional context (e.g., changes made, old/new values)
    diff: jsonb("diff"), // Before/after state diff: { before: {...}, after: {...} }
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    adminIdIdx: index("idx_admin_activity_logs_adminId").on(table.adminId),
    actionIdx: index("idx_admin_activity_logs_action").on(table.action),
    entityIdIdx: index("idx_admin_activity_logs_entityId").on(table.entityId),
    createdAtIdx: index("idx_admin_activity_logs_createdAt").on(
      table.createdAt,
    ),
  }),
);

export type AdminActivityLog = typeof adminActivityLogs.$inferSelect;
export type NewAdminActivityLog = typeof adminActivityLogs.$inferInsert;
