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

/**
 * Discount audit event types
 */
export const discountAuditEventTypeEnum = pgEnum("discount_audit_event_type", [
  "DISCOUNT_ENGINE_RUN",
  "DISCOUNT_SNAPSHOT_CREATED",
  "DISCOUNT_SNAPSHOT_USED",
  "DISCOUNT_RULE_CHANGE",
  "DISCOUNT_ELIGIBILITY_CHANGE",
  "ORDER_DISCOUNT_FINALIZED",
  "REFUND_DISCOUNT_APPLIED",
  "DRIFT_DETECTED",
]);

/**
 * Discount audit log severity levels
 */
export const discountAuditSeverityEnum = pgEnum("discount_audit_severity", [
  "INFO",
  "WARNING",
  "CRITICAL",
]);

/**
 * Discount audit logs table
 * Stores immutable audit trail of all discount-related operations
 */
export const discountAuditLogs = pgTable(
  "discount_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    event: discountAuditEventTypeEnum("event").notNull(),
    severity: discountAuditSeverityEnum("severity").notNull().default("INFO"),

    // Context identifiers
    cartId: uuid("cart_id"),
    checkoutId: uuid("checkout_id"),
    orderId: uuid("order_id"),
    paymentIntentId: text("payment_intent_id"),

    // Snapshot metadata
    snapshotVersion: text("snapshot_version"),
    ruleHash: text("rule_hash"),
    engineVersion: text("engine_version"),

    // Computed values
    computedSubtotal: real("computed_subtotal"),
    computedTotal: real("computed_total"),
    snapshotTotal: real("snapshot_total"),
    paymentAmount: real("payment_amount"),

    // Discount information
    appliedDiscountIds: jsonb("applied_discount_ids"), // JSON array of discount IDs

    // Drift detection details
    driftDetails: jsonb("drift_details"), // JSON object with drift information

    // Additional metadata
    metadata: jsonb("metadata"), // JSON object for flexible metadata storage
  },
  (table) => ({
    timestampIdx: index("discount_audit_logs_timestamp_idx").on(
      table.timestamp,
    ),
    eventIdx: index("discount_audit_logs_event_idx").on(table.event),
    severityIdx: index("discount_audit_logs_severity_idx").on(table.severity),
    cartIdIdx: index("discount_audit_logs_cart_id_idx").on(table.cartId),
    checkoutIdIdx: index("discount_audit_logs_checkout_id_idx").on(
      table.checkoutId,
    ),
    orderIdIdx: index("discount_audit_logs_order_id_idx").on(table.orderId),
    paymentIntentIdIdx: index("discount_audit_logs_payment_intent_id_idx").on(
      table.paymentIntentId,
    ),
    ruleHashIdx: index("discount_audit_logs_rule_hash_idx").on(table.ruleHash),
  }),
);

export const discountAuditLogsRelations = relations(
  discountAuditLogs,
  () => ({}),
);

export type DiscountAuditLog = typeof discountAuditLogs.$inferSelect;
export type NewDiscountAuditLog = typeof discountAuditLogs.$inferInsert;
