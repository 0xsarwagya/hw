import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { bundleSets } from "./bundle-sets";

export const bundles = pgTable(
  "bundles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    allowMixAndMatch: boolean("allow_mix_and_match").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    isActiveIdx: index("bundles_is_active_idx").on(table.isActive),
  }),
);

export const bundlesRelations = relations(bundles, ({ many }) => ({
  sets: many(bundleSets),
}));

export type Bundle = typeof bundles.$inferSelect;
export type NewBundle = typeof bundles.$inferInsert;
