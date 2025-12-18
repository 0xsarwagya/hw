import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { customerGroups } from "./customer-groups";
import { users } from "./users";

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    email: text("email").notNull().unique(),
    phone: text("phone").notNull().unique(),
    name: text("name").notNull(),
    gstin: text("gstin").unique(),
    isGuest: boolean("is_guest").notNull().default(true),
    emailVerified: boolean("email_verified").notNull().default(false),
    customerGroupId: uuid("customer_group_id").references(
      () => customerGroups.id,
      {
        onDelete: "set null",
      },
    ), // Customer group assignment
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("customers_email_idx").on(table.email),
    phoneIdx: index("customers_phone_idx").on(table.phone),
    userIdIdx: index("customers_user_id_idx").on(table.userId),
    gstinIdx: index("customers_gstin_idx").on(table.gstin),
    customerGroupIdIdx: index("customers_customer_group_id_idx").on(
      table.customerGroupId,
    ),
  }),
);

export const customersRelations = relations(customers, ({ one }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  customerGroup: one(customerGroups, {
    fields: [customers.customerGroupId],
    references: [customerGroups.id],
  }),
}));

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
