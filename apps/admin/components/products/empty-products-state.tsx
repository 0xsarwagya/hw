import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  PRODUCT_EMPTY_STATE_TITLE,
  PRODUCT_EMPTY_STATE_DESCRIPTION,
} from "@/lib/constants/products.constants";

/**
 * Empty state component shown when no products are found
 * Provides call-to-action to create first product
 */
export function EmptyProductsState() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p className="text-lg font-medium mb-2">{PRODUCT_EMPTY_STATE_TITLE}</p>
      <p className="text-sm mb-4">{PRODUCT_EMPTY_STATE_DESCRIPTION}</p>
      <Button asChild>
        <Link href="/products/create">
          <Plus className="mr-2 h-4 w-4" />
          Create Product
        </Link>
      </Button>
    </div>
  );
}

