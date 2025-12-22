"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useAddToCart } from "@/hooks/use-cart";
import type { Product } from "@/lib/validations/product";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useAddToCart();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Note: This is a simplified version. In production, you'd fetch variants
    // and show a variant selector or use the first available variant
    // For now, we'll redirect to product detail page where variant selection happens
    window.location.href = `/products/${product.id}`;
  };

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-square bg-muted">
          {/* Placeholder for product image */}
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {product.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {product.description || "No description"}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                ₹{product.priceIncludingGst.toFixed(2)}
              </p>
              {product.priceExcludingGst !== product.priceIncludingGst && (
                <p className="text-sm text-muted-foreground line-through">
                  ₹{product.priceExcludingGst.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            onClick={handleAddToCart}
            disabled={addToCart.isPending}
            className="w-full"
          >
            {addToCart.isPending ? "Adding..." : "Add to Cart"}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
