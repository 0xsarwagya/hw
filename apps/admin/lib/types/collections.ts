export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

export interface CollectionProduct {
  id: string;
  title: string;
  price: number;
  status: "draft" | "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionInput {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateCollectionInput {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
}

export interface CollectionQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedCollectionsResponse {
  data: Collection[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface AddProductsToCollectionInput {
  productIds: string[];
}

export interface AddProductsToCollectionResponse {
  message: string;
  added: number;
  skipped: number;
}
