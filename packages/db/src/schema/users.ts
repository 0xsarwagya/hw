import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { adminRoles } from "./admin-roles";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "customer",
  "support",
  "reviewer",
  "marketing",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").notNull().default("customer"),
    roleId: uuid("role_id").references(() => adminRoles.id, {
      onDelete: "set null",
    }), // Reference to admin_roles for granular permissions
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
