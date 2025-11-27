import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  integer,
  real,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const shippingRuleTypeEnum = pgEnum("shipping_rule_type", [
  "weight_based",
  "distance_based",
  "zone_based",
  "state_based",
]);

export const shippingPaymentMethodEnum = pgEnum("shipping_payment_method", [
  "prepaid",
  "cod",
  "both",
]);

export const shippingRules = pgTable(
  "shipping_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: shippingRuleTypeEnum("type").notNull(),
    zone: text("zone"), // shipping zone (metro, zone_a, etc.)
    state: text("state"), // specific state if state-based rule
    minWeight: integer("min_weight"), // in grams
    maxWeight: integer("max_weight"), // in grams
    baseRate: real("base_rate").notNull(), // base shipping rate
    additionalRate: real("additional_rate"), // per additional unit
    codCharge: real("cod_charge"), // COD handling charge
    paymentMethods: shippingPaymentMethodEnum("payment_methods").notNull().default("both"),
    isActive: boolean("is_active").notNull().default(true),
    priority: integer("priority").notNull().default(0), // higher priority rules override lower ones
    conditions: text("conditions"), // JSON string for complex conditions
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index("shipping_rules_type_idx").on(table.type),
    zoneIdx: index("shipping_rules_zone_idx").on(table.zone),
    stateIdx: index("shipping_rules_state_idx").on(table.state),
    activeIdx: index("shipping_rules_active_idx").on(table.isActive),
    priorityIdx: index("shipping_rules_priority_idx").on(table.priority),
  }),
);

export const shippingZoneRates = pgTable(
  "shipping_zone_rates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    zone: text("zone").notNull(),
    minWeight: integer("min_weight").notNull().default(0), // in grams
    maxWeight: integer("max_weight"), // in grams, null means unlimited
    baseRate: real("base_rate").notNull(),
    additionalPerKg: real("additional_per_kg"), // additional rate per kg
    estimatedDays: integer("estimated_days").notNull().default(3),
    codAvailable: boolean("cod_available").notNull().default(true),
    codCharge: real("cod_charge"), // COD handling charge
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    zoneIdx: index("shipping_zone_rates_zone_idx").on(table.zone),
    activeIdx: index("shipping_zone_rates_active_idx").on(table.isActive),
  }),
);

export const stateShippingRules = pgTable(
  "state_shipping_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    state: text("state").notNull(),
    stateCode: text("state_code").notNull(),
    codAvailable: boolean("cod_available").notNull().default(true),
    codCharge: real("cod_charge"), // state-specific COD charge
    specialHandling: boolean("special_handling").notNull().default(false),
    restrictedItems: text("restricted_items"), // JSON array of restricted item types
    additionalDays: integer("additional_days").notNull().default(0), // additional delivery days
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    stateIdx: index("state_shipping_rules_state_idx").on(table.state),
    stateCodeIdx: index("state_shipping_rules_state_code_idx").on(table.stateCode),
    activeIdx: index("state_shipping_rules_active_idx").on(table.isActive),
  }),
);

export type ShippingRule = typeof shippingRules.$inferSelect;
export type NewShippingRule = typeof shippingRules.$inferInsert;
export type ShippingZoneRate = typeof shippingZoneRates.$inferSelect;
export type NewShippingZoneRate = typeof shippingZoneRates.$inferInsert;
export type StateShippingRule = typeof stateShippingRules.$inferSelect;
export type NewStateShippingRule = typeof stateShippingRules.$inferInsert;
