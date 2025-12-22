/**
 * Bundle-related TypeScript types
 * Mapped from backend DTOs
 */

export interface BundleSetItem {
  id: string;
  variantId: string;
  createdAt: Date;
}

export interface BundleSet {
  id: string;
  bundleId: string;
  title: string;
  description?: string;
  minQuantity: number;
  maxQuantity: number;
  sortOrder: number;
  items: BundleSetItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Bundle {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  allowMixAndMatch: boolean;
  sets: BundleSet[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedBundlesResponse {
  data: Bundle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BundleQueryParams {
  page?: number;
  limit?: number;
}

export interface CreateBundleInput {
  title: string;
  description?: string | null;
  isActive?: boolean;
  allowMixAndMatch?: boolean;
}

export type UpdateBundleInput = Partial<CreateBundleInput>;

export interface CreateBundleSetInput {
  title: string;
  description?: string;
  minQuantity: number;
  maxQuantity: number;
}

export type UpdateBundleSetInput = Partial<CreateBundleSetInput>;

export interface AddBundleSetItemInput {
  variantId: string;
}
