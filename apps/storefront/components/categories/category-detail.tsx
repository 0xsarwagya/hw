"use client";

import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/products/product-card";
import { Card } from "@/components/ui/card";
import { endpoints, get } from "@/lib/api/client";
import { categorySchema } from "@/lib/validations/category";
import { paginatedProductsSchema } from "@/lib/validations/product";

interface CategoryDetailProps {
  slug: string;
}

export function CategoryDetail({ slug }: CategoryDetailProps) {
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ["categories", "slug", slug],
    queryFn: async () => {
      const data = await get(endpoints.categories.bySlug(slug));
      return categorySchema.parse(data);
    },
    enabled: !!slug,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["categories", category?.id, "products"],
    queryFn: async () => {
      if (!category) return null;
      const data = await get(endpoints.categories.products(category.id));
      return paginatedProductsSchema.parse(data);
    },
    enabled: !!category,
  });

  if (categoryLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-8" />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <div className="p-8 text-center">
            <p className="text-destructive mb-4">Category not found</p>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/categories";
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Back to Categories
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
      {category.description && (
        <p className="text-muted-foreground mb-8">{category.description}</p>
      )}

      {productsLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`skeleton-${i.toString()}`} className="animate-pulse">
              <div className="bg-muted h-64 rounded-lg mb-4" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : !products || products.data.length === 0 ? (
        <Card>
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              No products found in this category
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
