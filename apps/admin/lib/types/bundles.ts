/**
 * Bundle-related TypeScript types
 * Mapped from backend DTOs
 */

export interface BundleSetItem {
  id: string;
  bundleSetId: string;
  productVariantId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BundleSet {
  id: string;
  bundleId: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  items: BundleSetItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Bundle {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
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
}

export type UpdateBundleInput = Partial<CreateBundleInput>;

export interface CreateBundleSetInput {
  name: string;
  minSelections: number;
  maxSelections: number;
}

export type UpdateBundleSetInput = Partial<CreateBundleSetInput>;

export interface AddBundleSetItemInput {
  productVariantId: string;
  quantity: number;
}

