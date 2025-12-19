/**
 * Helper functions for price calculations in pricing engine
 * Extracted to improve readability and maintainability
 */

import { calculatePriceAfterOverride as calculatePriceWithStrategy } from "./override-strategies/price-override.strategy";
import { PriceListOverride } from "./pricing-engine.types";

/**
 * Calculate price after applying price list override
 *
 * Price list overrides allow customer-specific pricing:
 * - FIXED: Set a specific price (e.g., VIP customers get $50 price)
 * - PERCENTAGE: Apply a discount percentage (e.g., 20% off for wholesale customers)
 *
 * PERCENTAGE is applied as a discount (subtracted from base price)
 *
 * Uses strategy pattern for extensibility - new override types can be added
 * by implementing PriceOverrideStrategy interface
 */
export function calculatePriceAfterOverride(
  basePrice: number,
  override: PriceListOverride | null,
): number {
  return calculatePriceWithStrategy(basePrice, override);
}

/**
 * Calculate effective price considering sale price and override
 *
 * Business rule: Sale price takes precedence over price list overrides when active
 * This ensures promotional sales are always honored, even for VIP customers
 *
 * Prices are clamped to 0 (can't be negative) and rounded to 2 decimal places
 */
export function calculateEffectivePrice(
  basePrice: number,
  priceAfterOverride: number,
  salePrice: number | undefined,
  isSaleActive: boolean,
): number {
  // Sale price overrides customer-specific pricing when active
  if (isSaleActive && salePrice !== undefined) {
    return Math.max(0, roundToTwoDecimals(salePrice));
  }

  // Use price list override if no active sale
  return Math.max(0, roundToTwoDecimals(priceAfterOverride));
}

/**
 * Round to 2 decimal places
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
