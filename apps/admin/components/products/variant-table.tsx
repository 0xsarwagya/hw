"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Money } from "../orders/money";
import type { Variant } from "@/lib/types/products";

interface VariantTableProps {
  variants: Variant[];
  productId: string;
  onDelete?: (variantId: string) => void;
  isLoading?: boolean;
}

export function VariantTable({
  variants,
  productId,
  onDelete,
  isLoading = false,
}: VariantTableProps) {
  if (isLoading) {
    return null; // Skeleton handled by parent
  }

  if (variants.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-lg font-medium mb-2">No variants found</p>
        <p className="text-sm">Add a variant to get started</p>
      </div>
    );
  }

  const getVariantName = (variant: Variant) => {
    const parts: string[] = [];
    if (variant.size) parts.push(variant.size);
    if (variant.color) parts.push(variant.color);
    return parts.length > 0 ? parts.join(" / ") : "Default";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead>Variant</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Inventory</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((variant) => (
            <TableRow key={variant.id}>
              <TableCell>
                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                  {/* Placeholder - would show variant image if available */}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{getVariantName(variant)}</div>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded">{variant.sku}</code>
              </TableCell>
              <TableCell>
                <Money amount={variant.salePrice || variant.price} />
                {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
                  <div className="text-xs text-muted-foreground line-through">
                    <Money amount={variant.compareAtPrice} />
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className={variant.inventory <= 0 ? "text-destructive" : ""}>
                  {variant.inventory}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/products/${productId}/variants/${variant.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(variant.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

