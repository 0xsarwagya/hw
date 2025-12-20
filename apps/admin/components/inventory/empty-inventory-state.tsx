"use client";

import { Boxes } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Empty state component for inventory list when no items are found
 */
export function EmptyInventoryState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Boxes className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No inventory items found</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        Try adjusting your filters or search terms to find what you're looking
        for.
      </p>
      <Button asChild variant="outline">
        <Link href="/inventory/bulk-adjust">Bulk Adjust Inventory</Link>
      </Button>
    </div>
  );
}
