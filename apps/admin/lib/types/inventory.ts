/**
 * Inventory-related TypeScript types
 * Mapped from backend DTOs
 */

export type InventoryAdjustmentType = "increase" | "decrease" | "set";

export type InventoryAdjustmentReason =
  | "received"
  | "correction"
  | "damaged"
  | "lost"
  | "returned"
  | "giveaway"
  | "manual";

export interface InventoryListItem {
  variantId: string;
  productId: string;
  sku: string;
  title: string;
  attributes?: Record<string, string>;
  inventory: number;
  committed: number;
  available: number;
  lowStock: boolean;
  updatedAt: Date | string;
}

export interface PaginatedInventoryResponse {
  data: InventoryListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InventoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "draft" | "active" | "archived";
  lowStock?: boolean;
  outOfStock?: boolean;
  categoryId?: string;
  sortBy?: "inventory" | "committed" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface InventoryItem {
  variantId: string;
  productId: string;
  sku: string;
  title: string;
  description?: string;
  attributes?: Record<string, string>;
  inventory: number;
  committed: number;
  available: number;
  lowStockThreshold: number;
  lowStock: boolean;
  lastAdjustment?: {
    id: string;
    type: string;
    quantity: number;
    reason: string;
    createdAt: Date | string;
    actorAdminId: string;
  };
  updatedAt: Date | string;
}

export interface InventoryLogEntry {
  id: string;
  variantId: string;
  delta: number;
  oldInventory: number;
  newInventory: number;
  type: InventoryAdjustmentType;
  reason: InventoryAdjustmentReason;
  actorAdminId: string;
  metadata?: {
    orderId?: string;
    refundId?: string;
    note?: string;
    [key: string]: unknown;
  };
  createdAt: Date | string;
}

export interface InventoryLogsQueryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  actor?: string;
  reason?: InventoryAdjustmentReason;
  type?: InventoryAdjustmentType;
  orderId?: string;
  refundId?: string;
}

export interface PaginatedInventoryLogsResponse {
  data: InventoryLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ActiveReservation {
  cartId: string;
  qty: number;
  expiresAt: Date | string;
}

export interface InventoryReservations {
  variantId: string;
  reserved: number;
  expired: number;
  activeReservations: ActiveReservation[];
}

export interface ReservationSummaryItem {
  variantId: string;
  committed: number;
}

export interface ReservationsSummary {
  totalCommitted: number;
  variantCount: number;
  variants: ReservationSummaryItem[];
}

export interface InventorySettings {
  id: string;
  globalLowStockThreshold: number;
  perVariantOverrides?: Record<string, number>;
  updatedAt: Date | string;
  updatedBy?: string;
}

export interface UpdateInventorySettingsInput {
  globalLowStockThreshold: number;
  perVariantOverrides?: Record<string, number>;
}

export interface AdjustInventoryInput {
  type: InventoryAdjustmentType;
  quantity: number;
  reason: InventoryAdjustmentReason;
  note?: string;
}

export interface InventoryAdjustment {
  id: string;
  variantId: string;
  oldQuantity: number;
  newQuantity: number;
  delta: number;
  type: InventoryAdjustmentType;
  reason: InventoryAdjustmentReason;
  note?: string;
  actorAdminId: string;
  createdAt: Date | string;
}

export interface BulkAdjustmentItem {
  sku: string;
  type: InventoryAdjustmentType;
  quantity: number;
  reason: InventoryAdjustmentReason;
  note?: string;
}

export interface BulkAdjustInventoryInput {
  adjustments: BulkAdjustmentItem[];
}

export interface BulkAdjustmentResult {
  sku: string;
  success: boolean;
  error?: string;
  adjustmentId?: string;
}

export interface BulkAdjustInventoryResponse {
  results: BulkAdjustmentResult[];
  total: number;
  successful: number;
  failed: number;
}

export interface SkuMovement {
  sku: string;
  variantId: string;
  productTitle: string;
  quantity: number;
}

export interface InventoryHealth {
  totalStock: number;
  availableStock: number;
  committedStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  fastestMovingSkus: SkuMovement[];
  slowestMovingSkus: SkuMovement[];
}

export interface VariantIndexItem {
  variantId: string;
  sku: string;
  productTitle: string;
  attributes?: Record<string, string>;
}

export interface VariantsIndex {
  variants: VariantIndexItem[];
}

export interface InventoryMetrics {
  available: number;
  reserved: number;
  reserved_ratio: number;
  expired_reservations_count: number;
  failed_reservations: number;
}
