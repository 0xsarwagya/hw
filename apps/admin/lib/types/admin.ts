/**
 * Admin-related TypeScript types
 * Mapped from backend DTOs
 */

export interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  pendingOrders: number;
  activeProducts: number;
}
