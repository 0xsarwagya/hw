import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const admin2fa = pgTable("admin_2fa", {
  adminId: uuid("admin_id")
    .notNull()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").array(), // Stored as text[]
  enabled: boolean("enabled").notNull().default(false),
});

export type Admin2FA = typeof admin2fa.$inferSelect;
export type NewAdmin2FA = typeof admin2fa.$inferInsert;
