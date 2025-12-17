import { createHash } from "node:crypto";
import { DiscountResponseDto } from "../dto/discount-response.dto";

/**
 * Compute hash of discount rules for snapshot integrity
 * Hash includes: rules, priority, stack rules, tiers, BOGO configs
 */
export function computeRuleHash(discounts: DiscountResponseDto[]): string {
  // Sort discounts by ID for deterministic hashing
  const sorted = [...discounts].sort((a, b) => a.id.localeCompare(b.id));

  // Create hash input from discount properties that affect computation
  const hashInput = sorted.map((d) => ({
    id: d.id,
    priority: d.priority,
    canStack: d.canStack,
    mutuallyExclusive: d.mutuallyExclusive,
    excludedDiscountIds: d.excludedDiscountIds || [],
    value: d.value,
    valueType: d.valueType,
    type: d.type,
    scope: d.scope,
    tieredRules: d.tieredRules || [],
    // Include filter properties that affect eligibility
    productIds: d.productIds || [],
    categoryIds: d.categoryIds || [],
    collectionIds: d.collectionIds || [],
    tagIds: d.tagIds || [],
    buyProductIds: d.buyProductIds || [],
    buyCategoryIds: d.buyCategoryIds || [],
    buyCollectionIds: d.buyCollectionIds || [],
    buyTagIds: d.buyTagIds || [],
    getProductIds: d.getProductIds || [],
    getCategoryIds: d.getCategoryIds || [],
    getCollectionIds: d.getCollectionIds || [],
    getTagIds: d.getTagIds || [],
  }));

  const hash = createHash("sha256")
    .update(JSON.stringify(hashInput))
    .digest("hex");

  return hash;
}
