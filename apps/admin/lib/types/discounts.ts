/**
 * Discount-related TypeScript types
 * Mapped from backend DTOs
 */

export type DiscountType = "STANDARD" | "BUY_GET";

export interface Discount {
  id: string;
  code: string;
  type: DiscountType;
  description: string | null;
  value: number;
  valueType: "percentage" | "fixed";
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
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
}

export interface CreateDiscountInput {
  code: string;
  type: DiscountType;
  description?: string | null;
  value: number;
  valueType: "percentage" | "fixed";
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  maxUses?: number | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive?: boolean;
}

export type UpdateDiscountInput = Partial<CreateDiscountInput>;

