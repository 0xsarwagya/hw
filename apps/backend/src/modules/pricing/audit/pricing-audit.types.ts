/**
 * Pricing audit event types
 */
export enum PricingAuditEventType {
  PRICING_ENGINE_RUN = "PRICING_ENGINE_RUN",
  PRICING_SNAPSHOT_CREATED = "PRICING_SNAPSHOT_CREATED",
  PRICING_SNAPSHOT_USED = "PRICING_SNAPSHOT_USED",
  PRICE_LIST_CHANGE = "PRICE_LIST_CHANGE",
  PRICING_DRIFT_DETECTED = "PRICING_DRIFT_DETECTED",
}

/**
 * Pricing drift severity levels
 */
export enum PricingDriftSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
}

/**
 * Pricing audit log entry interface
 */
export interface PricingAuditLogEntry {
  event: PricingAuditEventType;
  variantId?: string;
  orderId?: string;
  checkoutId?: string;
  priceListId?: string;
  customerGroupId?: string;
  basePrice?: number;
  effectivePrice?: number;
  snapshotPrice?: number;
  paymentAmount?: number;
  rulesetVersion?: string;
  ruleHash?: string;
  engineVersion?: string;
  // biome-ignore lint/suspicious/noExplicitAny: Flexible structure for drift details
  driftDetails?: any;
  severity?: PricingDriftSeverity;
  // biome-ignore lint/suspicious/noExplicitAny: Flexible metadata structure
  metadata?: Record<string, any>;
}
