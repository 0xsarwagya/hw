"use client";

import { Badge } from "@/components/ui/badge";
import type { ProductStatus } from "@/lib/types/products";

interface ProductStatusBadgeProps {
  status: ProductStatus;
}

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  const variants: Record<
    ProductStatus,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    draft: {
      label: "Draft",
      variant: "outline",
    },
    active: {
      label: "Active",
      variant: "default",
    },
    archived: {
      label: "Archived",
      variant: "secondary",
    },
  };

  const { label, variant } = variants[status];

  return <Badge variant={variant}>{label}</Badge>;
}
