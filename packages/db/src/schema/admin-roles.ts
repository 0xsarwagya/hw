import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const adminRoles = pgTable(
  "admin_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(), // "admin", "support", "reviewer", "marketing", "inventory", "sales"
    permissions: jsonb("permissions").notNull(), // Granular scopes
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("idx_admin_roles_name").on(table.name),
  }),
);

export type AdminRole = typeof adminRoles.$inferSelect;
export type NewAdminRole = typeof adminRoles.$inferInsert;
