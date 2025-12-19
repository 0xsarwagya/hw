"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, Copy } from "lucide-react";
import { ProductStatusBadge } from "./product-status-badge";
import { Money } from "../orders/money";
import { DateTime } from "../orders/date-time";
import { TableRowActions, type TableRowAction } from "../common/table-row-actions";
import type { Product } from "@/lib/types/products";
import { PRODUCT_PLACEHOLDER_IMAGE_URL } from "@/lib/constants/products.constants";

interface ProductTableRowProps {
  product: Product;
  onDelete: (productId: string) => void;
}

/**
 * Single row component for products table
 * Handles product display and row-level actions
 */
export function ProductTableRow({ product, onDelete }: ProductTableRowProps) {
  const router = useRouter();

  const handleRowClick = (event: React.MouseEvent<HTMLTableRowElement>) => {
    const target = event.target as HTMLElement;
    const isMenuOrButton = target.closest('[role="menu"]') || target.closest("button");
    
    if (!isMenuOrButton) {
      router.push(`/products/${product.id}`);
    }
  };

  const rowActions: TableRowAction[] = [
    {
      type: "link",
      label: "Edit",
      href: `/products/${product.id}`,
      icon: Edit,
    },
    {
      type: "button",
      label: "Duplicate",
      onClick: () => {
        // TODO: Implement duplicate functionality
      },
      icon: Copy,
    },
    {
      type: "button",
      label: "Delete",
      onClick: () => onDelete(product.id),
      icon: Trash2,
      destructive: true,
    },
  ];

  return (
    <TableRow
      key={product.id}
      className="cursor-pointer hover:bg-muted/50"
      onClick={handleRowClick}
    >
      <TableCell>
        <ProductThumbnail
          thumbnailUrl={product.thumbnailUrl}
          alt={product.title}
        />
      </TableCell>
      <TableCell>
        <Link
          href={`/products/${product.id}`}
          className="font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {product.title}
        </Link>
      </TableCell>
      <TableCell>
        <ProductStatusBadge status={product.status} />
      </TableCell>
      <TableCell>
        <Money amount={product.price} />
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">-</span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">-</span>
      </TableCell>
      <TableCell>
        <DateTime date={product.updatedAt} />
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <TableRowActions actions={rowActions} />
      </TableCell>
    </TableRow>
  );
}

interface ProductThumbnailProps {
  thumbnailUrl?: string | null;
  alt: string;
}

/**
 * Product thumbnail image component
 * Shows product image or placeholder
 */
function ProductThumbnail({ thumbnailUrl, alt }: ProductThumbnailProps) {
  return (
    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={PRODUCT_PLACEHOLDER_IMAGE_URL}
          alt="Placeholder"
          className="w-8 h-8 opacity-50"
        />
      )}
    </div>
  );
}

