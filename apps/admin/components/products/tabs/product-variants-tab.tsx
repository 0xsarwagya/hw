"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Variant } from "@/lib/types/products";
import dynamic from "next/dynamic";

const VariantTable = dynamic(
  () =>
    import("@/components/products/variant-table").then((mod) => ({
      default: mod.VariantTable,
    })),
  { loading: () => <div className="h-64 animate-pulse bg-muted rounded" /> }
);

interface ProductVariantsTabProps {
  productId: string;
  variants: Variant[];
  onDeleteVariant: (variantId: string) => void;
}

/**
 * Variants tab component for product editing
 * Manages product variants and their properties
 */
export function ProductVariantsTab({
  productId,
  variants,
  onDeleteVariant,
}: ProductVariantsTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Variants</CardTitle>
            <CardDescription>Manage product variants</CardDescription>
          </div>
          <Button asChild>
            <Link href={`/products/${productId}/variants/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Variant
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <VariantTable
          variants={variants}
          productId={productId}
          onDelete={onDeleteVariant}
        />
      </CardContent>
    </Card>
  );
}

