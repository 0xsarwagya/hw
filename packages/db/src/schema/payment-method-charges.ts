import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
ˀ * Payment method enum values
 * Supported payment methods for charge configuration
 */
export enum PaymentMethod {
  COD = "COD",
  RAZORPAY_UPI = "RAZORPAY_UPI",
  RAZORPAY_CARD = "RAZORPAY_CARD",
  STRIPE_CARD = "STRIPE_CARD",
  WALLET = "WALLET",
  NETBANKING = "NETBANKING",
  BNPL = "BNPL",
}

/**
 * Charge type enum values
 */
export enum ChargeType {
  FLAT = "FLAT",
  PERCENTAGE = "PERCENTAGE",
  MIXED = "MIXED",
}

/**
 * Payment method enum (for Drizzle)
 * Supported payment methods for charge configuration
 */
export const paymentMethodChargeEnum = pgEnum("payment_method_charge", [
  "COD",
  "RAZORPAY_UPI",
  "RAZORPAY_CARD",
  "STRIPE_CARD",
  "WALLET",
  "NETBANKING",
  "BNPL",
]);

/**
 * Charge type enum (for Drizzle)
 * FLAT: Fixed amount charge
 * PERCENTAGE: Percentage-based charge
 * MIXED: Combination of percentage + flat with min/max caps
 */
export const chargeTypeEnum = pgEnum("charge_type", [
  "FLAT",
  "PERCENTAGE",
  "MIXED",
]);

/**
 * Payment method charges table
 * Stores configurable charges for different payment methods
 */
export const paymentMethodCharges = pgTable(
  "payment_method_charges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    method: paymentMethodChargeEnum("method").notNull(),
    chargeType: chargeTypeEnum("charge_type").notNull(),
    flatAmount: integer("flat_amount").notNull().default(0), // in paise
    percentage: real("percentage").notNull().default(0), // e.g., 2.5 for 2.5%
    mixCap: integer("mix_cap"), // max cap in paise (nullable)
    mixMin: integer("mix_min"), // min charge in paise (nullable)
    isTaxable: boolean("is_taxable").notNull().default(false),
    currency: text("currency").notNull().default("INR"), // for multi-currency support
    // COD-specific restrictions
    codMaxAmount: integer("cod_max_amount"), // max order value for COD in paise (nullable)
    codDisallowHighValue: boolean("cod_disallow_high_value")
      .notNull()
      .default(false),
    codDisallowDigital: boolean("cod_disallow_digital").notNull().default(true),
    codDisallowPreorder: boolean("cod_disallow_preorder")
      .notNull()
      .default(true),
    /**
     * Disallow COD for international addresses (non-India)
     */
    codDisallowInternational: boolean("cod_disallow_international")
      .notNull()
      .default(true),
    /**
     * Restricted states for COD (array of state codes)
     * COD will be unavailable if shipping address is in these states
     */
    codRestrictedStates: jsonb("cod_restricted_states").$type<string[]>(),
    /**
     * Customer groups that can bypass COD restrictions (VIP override)
     * Array of customer group IDs
     */
    codAllowedCustomerGroups: jsonb("cod_allowed_customer_groups").$type<
      string[]
    >(),
    /**
     * Region restrictions (JSONB) - state/country restrictions for payment method
     * Format: { countries: string[], states: string[] }
     */
    restrictedRegions: jsonb("restricted_regions").$type<{
      countries?: string[];
      states?: string[];
    }>(),
    /**
     * Cart content restrictions (JSONB) - restrictions based on cart items
     * e.g., { hazmat: true, digital: true, subscription: true }
     */
    restrictedCartContent: jsonb("restricted_cart_content").$type<{
      hazmat?: boolean;
      digital?: boolean;
      subscription?: boolean;
    }>(),
    /**
     * Minimum order value for payment method (in paise)
     */
    minOrderValue: integer("min_order_value"),
    /**
     * Maximum order value for payment method (in paise)
     */
    maxOrderValue: integer("max_order_value"),
    /**
     * Store-level disabled flag - if true, payment method is disabled store-wide
     */
    storeLevelDisabled: boolean("store_level_disabled")
      .notNull()
      .default(false),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    methodIdx: index("payment_method_charges_method_idx").on(table.method),
    currencyIdx: index("payment_method_charges_currency_idx").on(
      table.currency,
    ),
    activeIdx: index("payment_method_charges_active_idx").on(table.active),
    methodCurrencyIdx: index("payment_method_charges_method_currency_idx").on(
      table.method,
      table.currency,
    ),
  }),
);

export const paymentMethodChargesRelations = relations(
  paymentMethodCharges,
  () => ({}),
);

export type PaymentMethodCharge = typeof paymentMethodCharges.$inferSelect;
export type NewPaymentMethodCharge = typeof paymentMethodCharges.$inferInsert;
