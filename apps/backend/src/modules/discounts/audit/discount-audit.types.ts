/**
 * Discount audit event types
 */
export enum AuditEventType {
  DISCOUNT_ENGINE_RUN = "DISCOUNT_ENGINE_RUN",
  DISCOUNT_SNAPSHOT_CREATED = "DISCOUNT_SNAPSHOT_CREATED",
  DISCOUNT_SNAPSHOT_USED = "DISCOUNT_SNAPSHOT_USED",
  DISCOUNT_RULE_CHANGE = "DISCOUNT_RULE_CHANGE",
  DISCOUNT_ELIGIBILITY_CHANGE = "DISCOUNT_ELIGIBILITY_CHANGE",
  ORDER_DISCOUNT_FINALIZED = "ORDER_DISCOUNT_FINALIZED",
  REFUND_DISCOUNT_APPLIED = "REFUND_DISCOUNT_APPLIED",
  DRIFT_DETECTED = "DRIFT_DETECTED",
}

/**
 * Drift severity levels
 */
export enum DriftSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
}

/**
 * Discount audit log entry interface
 */
export interface DiscountAuditLogEntry {
  event: AuditEventType;
  cartId?: string;
  checkoutId?: string;
  orderId?: string;
  paymentIntentId?: string;
  snapshotVersion?: string;
  ruleHash?: string;
  engineVersion?: string;
  computedSubtotal?: number;
  computedTotal?: number;
  snapshotTotal?: number;
  paymentAmount?: number;
  appliedDiscountIds?: string[];
  // biome-ignore lint/suspicious/noExplicitAny: Flexible structure for drift details
  driftDetails?: any;
  severity?: DriftSeverity;
  // biome-ignore lint/suspicious/noExplicitAny: Flexible metadata structure for audit logs
  metadata?: Record<string, any>;
}
