import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const stores = pgTable(
  "stores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    domain: text("domain").notNull().unique(),
    currency: text("currency").notNull().default("INR"), // "INR", "USD", etc.
    primaryColor: text("primary_color"), // Hex color code
    logoUrl: text("logo_url"), // URL to logo image
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    domainIdx: index("idx_stores_domain").on(table.domain),
    isDefaultIdx: index("idx_stores_isDefault").on(table.isDefault),
  }),
);

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
