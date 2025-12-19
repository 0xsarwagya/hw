/**
 * Inventory-related TypeScript types
 * Mapped from backend DTOs
 */

export interface InventoryMetrics {
  available: number;
  reserved: number;
  reservedRatio: number;
  expiredReservationsCount: number;
  failedReservationsCount: number;
}

