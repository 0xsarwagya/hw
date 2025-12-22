"use client";

import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/products/product-card";
import { Card } from "@/components/ui/card";
import { endpoints, get } from "@/lib/api/client";
import { collectionSchema } from "@/lib/validations/collection";
import { paginatedProductsSchema } from "@/lib/validations/product";

interface CollectionDetailProps {
  collectionId: string;
}

export function CollectionDetail({ collectionId }: CollectionDetailProps) {
  const { data: collection, isLoading: collectionLoading } = useQuery({
    queryKey: ["collections", collectionId],
    queryFn: async () => {
      const data = await get(endpoints.collections.detail(collectionId));
      return collectionSchema.parse(data);
    },
    enabled: !!collectionId,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["collections", collectionId, "products"],
    queryFn: async () => {
      const data = await get(endpoints.collections.products(collectionId));
      return paginatedProductsSchema.parse(data);
    },
    enabled: !!collectionId,
  });

  if (collectionLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-8" />
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <div className="p-8 text-center">
            <p className="text-destructive mb-4">Collection not found</p>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/collections";
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Back to Collections
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{collection.name}</h1>
      {collection.description && (
        <p className="text-muted-foreground mb-8">{collection.description}</p>
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
              No products found in this collection
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
