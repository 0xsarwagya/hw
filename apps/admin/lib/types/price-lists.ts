/**
 * Price List-related TypeScript types
 * Mapped from backend DTOs
 */

export interface PriceListItem {
  id: string;
  priceListId: string;
  productVariantId: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceList {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  customerGroupId: string | null;
  items: PriceListItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedPriceListsResponse {
  data: PriceList[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePriceListInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
  customerGroupId?: string | null;
}

export type UpdatePriceListInput = Partial<CreatePriceListInput>;

export interface CreatePriceListItemInput {
  productVariantId: string;
  price: number;
}
