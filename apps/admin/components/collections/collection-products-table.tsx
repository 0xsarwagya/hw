"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { CollectionProduct } from "@/lib/types/collections";
import { Money } from "@/components/orders/money";
import { ProductStatusBadge } from "@/components/products/product-status-badge";

interface CollectionProductsTableProps {
  products: CollectionProduct[];
  collectionId: string;
  onRemove?: (productId: string) => void;
}

export function CollectionProductsTable({
  products,
  collectionId,
  onRemove,
}: CollectionProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No products in this collection</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[50px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">
              <Link href={`/products/${product.id}`} className="hover:underline">
                {product.title}
              </Link>
            </TableCell>
            <TableCell>
              <Money amount={product.price} />
            </TableCell>
            <TableCell>
              <ProductStatusBadge status={product.status} />
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/products/${product.id}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Product
                    </Link>
                  </DropdownMenuItem>
                  {onRemove && (
                    <DropdownMenuItem
                      onClick={() => onRemove(product.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove from Collection
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

