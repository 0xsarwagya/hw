/**
 * Discount-related TypeScript types
 * Mapped from backend DTOs
 */

export enum DiscountType {
  FIXED_AMOUNT = "FIXED_AMOUNT",
  PERCENTAGE = "PERCENTAGE",
  BUY_X_GET_Y = "BUY_X_GET_Y",
  TIERED = "TIERED",
  CART_LEVEL = "CART_LEVEL",
}

export enum DiscountApplicationType {
  AUTOMATIC = "AUTOMATIC",
  MANUAL = "MANUAL",
}

export enum DiscountValueType {
  AMOUNT = "AMOUNT",
  PERCENTAGE = "PERCENTAGE",
}

export enum DiscountScope {
  ORDER = "ORDER",
  PRODUCT = "PRODUCT",
}

export enum DriftSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
}

export enum AuditEventType {
  DRIFT_DETECTED = "DRIFT_DETECTED",
  DISCOUNT_APPLIED = "DISCOUNT_APPLIED",
  DISCOUNT_VALIDATED = "DISCOUNT_VALIDATED",
}

export interface TieredRule {
  minQuantity: number;
  value: number;
  valueType: DiscountValueType;
}

export interface Discount {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: DiscountType;
  applicationType: DiscountApplicationType;
  valueType: DiscountValueType;
  value: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  minQuantity: number | null;
  customerGroupIds: string | null; // JSON array string
  scope: DiscountScope;
  priority: number;
  canStack: boolean;
  mutuallyExclusive: boolean;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  productIds: string[];
  categoryIds: string[];
  collectionIds: string[];
  tagIds: string[];
  buyProductIds: string[];
  buyCategoryIds: string[];
  buyCollectionIds: string[];
  buyTagIds: string[];
  getProductIds: string[];
  getCategoryIds: string[];
  getCollectionIds: string[];
  getTagIds: string[];
  tieredRules: TieredRule[];
  excludedDiscountIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedDiscountsResponse {
  data: Discount[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DiscountQueryParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  type?: DiscountType;
  applicationType?: DiscountApplicationType;
  search?: string;
}

export interface CreateDiscountInput {
  code: string;
  name: string;
  description?: string;
  type: DiscountType;
  applicationType?: DiscountApplicationType;
  valueType: DiscountValueType;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  minQuantity?: number;
  customerGroupIds?: string; // JSON array string
  scope?: DiscountScope;
  priority?: number;
  canStack?: boolean;
  mutuallyExclusive?: boolean;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string
  isActive?: boolean;
  usageLimit?: number;
  perUserLimit?: number;
  productIds?: string[];
  categoryIds?: string[];
  collectionIds?: string[];
  tagIds?: string[];
  buyProductIds?: string[];
  buyCategoryIds?: string[];
  buyCollectionIds?: string[];
  buyTagIds?: string[];
  getProductIds?: string[];
  getCategoryIds?: string[];
  getCollectionIds?: string[];
  getTagIds?: string[];
  tieredRules?: TieredRule[];
  excludedDiscountIds?: string[];
}

export type UpdateDiscountInput = Partial<CreateDiscountInput>;

export interface DriftReportQuery {
  cartId?: string;
  checkoutId?: string;
  orderId?: string;
  paymentIntentId?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  severity?: DriftSeverity;
  page?: number;
  limit?: number;
}

export interface DriftReportEntry {
  id: string;
  timestamp: Date;
  event: AuditEventType;
  severity: DriftSeverity;
  cartId?: string;
  checkoutId?: string;
  orderId?: string;
  paymentIntentId?: string;
  driftDetails?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface PaginatedDriftReportResponse {
  data: DriftReportEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProfilerMetrics {
  rulesetVersion: number;
  rulesCount: number;
  bundleSizeKB: number;
  avgEngineRuntimeMs: number;
  redisLatencyMs: number;
  cacheHitRate: number;
  lastHotReloadAt: Date | null;
  totalEngineRuns: number;
  totalRulesApplied: number;
}
