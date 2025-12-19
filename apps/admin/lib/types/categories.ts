export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
  productCount?: number;
}

export interface CategoryTree extends Category {
  children?: CategoryTree[];
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  parentId?: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  parentId?: string | null;
  description?: string;
  imageUrl?: string;
}

export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedCategoriesResponse {
  data: Category[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
