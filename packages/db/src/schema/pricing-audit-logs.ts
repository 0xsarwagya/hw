import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const pricingAuditEventTypeEnum = pgEnum("pricing_audit_event_type", [
  "PRICING_ENGINE_RUN",
  "PRICING_SNAPSHOT_CREATED",
  "PRICING_SNAPSHOT_USED",
  "PRICE_LIST_CHANGE",
  "PRICING_DRIFT_DETECTED",
]);

export const pricingAuditSeverityEnum = pgEnum("pricing_audit_severity", [
  "INFO",
  "WARNING",
  "CRITICAL",
]);

export const pricingAuditLogs = pgTable(
  "pricing_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    event: pricingAuditEventTypeEnum("event").notNull(),
    severity: pricingAuditSeverityEnum("severity").notNull().default("INFO"),
    variantId: uuid("variant_id"),
    orderId: uuid("order_id"),
    checkoutId: uuid("checkout_id"),
    priceListId: uuid("price_list_id"),
    customerGroupId: uuid("customer_group_id"),
    basePrice: real("base_price"),
    effectivePrice: real("effective_price"),
    snapshotPrice: real("snapshot_price"),
    paymentAmount: real("payment_amount"),
    rulesetVersion: text("ruleset_version"),
    ruleHash: text("rule_hash"),
    engineVersion: text("engine_version"),
    driftDetails: jsonb("drift_details"),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    timestampIdx: index("pricing_audit_logs_timestamp_idx").on(table.timestamp),
    eventIdx: index("pricing_audit_logs_event_idx").on(table.event),
    severityIdx: index("pricing_audit_logs_severity_idx").on(table.severity),
    variantIdIdx: index("pricing_audit_logs_variant_id_idx").on(
      table.variantId,
    ),
    orderIdIdx: index("pricing_audit_logs_order_id_idx").on(table.orderId),
    checkoutIdIdx: index("pricing_audit_logs_checkout_id_idx").on(
      table.checkoutId,
    ),
    priceListIdIdx: index("pricing_audit_logs_price_list_id_idx").on(
      table.priceListId,
    ),
    ruleHashIdx: index("pricing_audit_logs_rule_hash_idx").on(table.ruleHash),
  }),
);

export const pricingAuditLogsRelations = relations(
  pricingAuditLogs,
  () => ({}),
);

export type PricingAuditLog = typeof pricingAuditLogs.$inferSelect;
export type NewPricingAuditLog = typeof pricingAuditLogs.$inferInsert;
