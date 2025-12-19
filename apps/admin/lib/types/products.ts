/**
 * Product-related TypeScript types
 * Mapped from backend DTOs
 */

export type ProductStatus = "draft" | "active" | "archived";

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  gstRate: number;
  gstAmount: number;
  priceExcludingGst: number;
  priceIncludingGst: number;
  pricingType?: "inclusive" | "exclusive";
  hsnCode: string | null;
  status: ProductStatus;
  categoryId: string | null;
  thumbnailUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Variant {
  id: string;
  productId: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  salePrice: number | null;
  saleStartDate: Date | null;
  saleEndDate: Date | null;
  inventory: number;
  size: string | null;
  color: string | null;
  weight: number | null;
  optionValues?: VariantOptionValue[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VariantOptionType {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariantOptionType {
  id: string;
  productId: string;
  optionTypeId: string | null;
  name: string;
  displayOrder: number;
  values?: VariantOptionValue[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VariantOptionValue {
  id: string;
  productVariantOptionTypeId: string;
  value: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  productId: string;
  variantId: string | null;
  url: string;
  altText: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  title: string;
  description?: string;
  price: number;
  gstRate?: number;
  pricingType?: "inclusive" | "exclusive";
  hsnCode?: string;
  status?: ProductStatus;
  categoryId?: string;
}

export interface UpdateProductInput {
  title?: string;
  description?: string;
  price?: number;
  gstRate?: number;
  pricingType?: "inclusive" | "exclusive";
  hsnCode?: string;
  status?: ProductStatus;
  categoryId?: string;
}

export interface CreateVariantInput {
  productId: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  currency?: string;
  salePrice?: number;
  saleStartDate?: Date;
  saleEndDate?: Date;
  inventory?: number;
  size?: string;
  color?: string;
  weight?: number;
  optionValueIds?: string[];
}

export interface UpdateVariantInput {
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  currency?: string;
  salePrice?: number;
  saleStartDate?: Date;
  saleEndDate?: Date;
  inventory?: number;
  size?: string;
  color?: string;
  weight?: number;
  optionValueIds?: string[];
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductStatus;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: "price" | "name" | "date";
  sortOrder?: "asc" | "desc";
}

export interface AddProductImageInput {
  imageKey: string;
  altText?: string;
  order?: number;
  variantId?: string;
}

export interface UpdateImageOrderInput {
  order: number;
}

export interface ProductWithVariants extends Product {
  variants?: Variant[];
  images?: ProductImage[];
}

