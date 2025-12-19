export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description?: string | null;
  imageUrl?: string | null;
  position?: number;
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
  position?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  parentId?: string | null;
  description?: string;
  imageUrl?: string;
  position?: number;
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
