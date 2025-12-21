import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Payment fee audit event types
 */
export const paymentFeeAuditEventTypeEnum = pgEnum(
  "payment_fee_audit_event_type",
  [
    "PAYMENT_FEE_APPLIED",
    "PAYMENT_FEE_OVERRIDDEN",
    "PAYMENT_METHOD_RESTRICTED",
    "PAYMENT_METHOD_NOT_AVAILABLE",
    "PAYMENT_FEE_CONFIGURATION_CHANGED",
  ],
);

/**
 * Payment fee audit severity levels
 */
export const paymentFeeAuditSeverityEnum = pgEnum(
  "payment_fee_audit_severity",
  ["INFO", "WARNING", "CRITICAL"],
);

/**
 * Payment fee audit logs table
 * Stores immutable audit trail of all payment fee-related operations
 */
export const paymentFeeAuditLogs = pgTable(
  "payment_fee_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    event: paymentFeeAuditEventTypeEnum("event").notNull(),
    severity: paymentFeeAuditSeverityEnum("severity").notNull().default("INFO"),

    // Context identifiers
    orderId: uuid("order_id"),
    checkoutId: uuid("checkout_id"),
    paymentIntentId: text("payment_intent_id"),

    // Payment method and fee information
    paymentMethod: text("payment_method").notNull(),
    feeAmount: integer("fee_amount"), // in paise
    feeBreakdown: jsonb("fee_breakdown"), // PaymentFeeBreakdownDto

    // Restriction/reason information
    reason: text("reason"), // Reason for restriction or unavailability

    // Additional metadata
    metadata: jsonb("metadata"), // JSON object for flexible metadata storage
  },
  (table) => ({
    timestampIdx: index("payment_fee_audit_logs_timestamp_idx").on(
      table.timestamp,
    ),
    eventIdx: index("payment_fee_audit_logs_event_idx").on(table.event),
    severityIdx: index("payment_fee_audit_logs_severity_idx").on(
      table.severity,
    ),
    orderIdIdx: index("payment_fee_audit_logs_order_id_idx").on(table.orderId),
    checkoutIdIdx: index("payment_fee_audit_logs_checkout_id_idx").on(
      table.checkoutId,
    ),
    paymentIntentIdIdx: index(
      "payment_fee_audit_logs_payment_intent_id_idx",
    ).on(table.paymentIntentId),
    paymentMethodIdx: index("payment_fee_audit_logs_payment_method_idx").on(
      table.paymentMethod,
    ),
  }),
);

export const paymentFeeAuditLogsRelations = relations(
  paymentFeeAuditLogs,
  () => ({}),
);

export type PaymentFeeAuditLog = typeof paymentFeeAuditLogs.$inferSelect;
export type NewPaymentFeeAuditLog = typeof paymentFeeAuditLogs.$inferInsert;
