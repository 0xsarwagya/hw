"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ProductStatusBadge } from "./product-status-badge";
import { Money } from "../orders/money";
import type { Product } from "@/lib/types/products";

interface ProductCardProps {
  product: Product;
  thumbnail?: string;
}

export function ProductCard({ product, thumbnail }: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {thumbnail && (
              <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                <img
                  src={thumbnail}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{product.title}</h3>
              <div className="mt-1 flex items-center gap-2">
                <Money amount={product.price} />
                <ProductStatusBadge status={product.status} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

