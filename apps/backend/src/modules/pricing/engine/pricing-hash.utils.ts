import crypto from "node:crypto";
import { PriceList } from "./pricing-engine.types";

/**
 * Compute hash of price lists for integrity checking
 * Used in pricing snapshots to detect rule changes
 */
export function computePriceListHash(priceLists: PriceList[]): string {
  // Sort price lists by ID for deterministic hashing
  const sorted = [...priceLists].sort((a, b) => a.id.localeCompare(b.id));

  // Create hashable structure
  const hashable = sorted.map((list) => ({
    id: list.id,
    name: list.name,
    type: list.type,
    priority: list.priority,
    isActive: list.isActive,
    startDate: list.startDate?.toISOString(),
    endDate: list.endDate?.toISOString(),
    items: list.items
      .map((item) => ({
        productVariantId: item.productVariantId,
        productId: item.productId,
        categoryId: item.categoryId,
        overrideType: item.overrideType,
        overrideValue: item.overrideValue,
      }))
      .sort((a, b) => {
        // Sort by specificity then by ID
        const aSpecificity = a.productVariantId ? 3 : a.productId ? 2 : 1;
        const bSpecificity = b.productVariantId ? 3 : b.productId ? 2 : 1;
        if (aSpecificity !== bSpecificity) {
          return bSpecificity - aSpecificity;
        }
        const aId = a.productVariantId || a.productId || a.categoryId || "";
        const bId = b.productVariantId || b.productId || b.categoryId || "";
        return aId.localeCompare(bId);
      }),
  }));

  const hashInput = JSON.stringify(hashable);
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}
