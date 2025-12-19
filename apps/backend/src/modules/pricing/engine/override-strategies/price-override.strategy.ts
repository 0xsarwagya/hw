/**
 * Strategy pattern for price override calculations
 *
 * Each override type implements its own calculation logic.
 * This makes it easy to add new override types without modifying existing code.
 *
 * **Benefits:**
 * - Extensible: Add new override types by implementing `PriceOverrideStrategy`
 * - Testable: Each strategy can be tested independently
 * - Maintainable: Override logic is isolated and easy to understand
 *
 * @example
 * ```typescript
 * // Add a new override type
 * class VolumeDiscountStrategy implements PriceOverrideStrategy {
 *   calculate(basePrice: number, overrideValue: number): number {
 *     // Volume discount logic
 *     return basePrice * (1 - overrideValue / 100);
 *   }
 * }
 *
 * // Register in factory
 * function getOverrideStrategy(type: OverrideType): PriceOverrideStrategy {
 *   switch (type) {
 *     case "VOLUME": return new VolumeDiscountStrategy();
 *     // ... existing cases
 *   }
 * }
 * ```
 */

import { PriceListOverride } from "../pricing-engine.types";

/**
 * Interface for price override calculation strategies
 *
 * Each strategy implements a different way to calculate the final price
 * based on the override type. This allows for polymorphic behavior
 * without complex if/else chains.
 */
export interface PriceOverrideStrategy {
  /**
   * Calculate the price after applying this override type
   *
   * @param basePrice - Original base price before override
   * @param overrideValue - Override value (interpreted based on strategy)
   * @returns Calculated price after override is applied
   *
   * @example
   * ```typescript
   * const strategy = new FixedPriceOverrideStrategy();
   * const finalPrice = strategy.calculate(100, 50); // Returns 50
   * ```
   */
  calculate(basePrice: number, overrideValue: number): number;
}

/**
 * Fixed price override strategy
 * Sets a specific price regardless of base price
 * Example: VIP customers get $50 price regardless of original price
 */
export class FixedPriceOverrideStrategy implements PriceOverrideStrategy {
  calculate(basePrice: number, overrideValue: number): number {
    // Fixed price completely replaces base price
    return overrideValue;
  }
}

/**
 * Percentage discount override strategy
 * Applies a percentage discount to the base price
 * Example: 20% means 20% off (not 20% of base)
 */
export class PercentagePriceOverrideStrategy implements PriceOverrideStrategy {
  calculate(basePrice: number, overrideValue: number): number {
    // Percentage is a discount: 20% means 20% off, not 20% of base
    return basePrice * (1 - overrideValue / 100);
  }
}

/**
 * Factory to get the appropriate strategy for an override type
 */
export function getOverrideStrategy(
  overrideType: "FIXED" | "PERCENTAGE",
): PriceOverrideStrategy {
  switch (overrideType) {
    case "FIXED":
      return new FixedPriceOverrideStrategy();
    case "PERCENTAGE":
      return new PercentagePriceOverrideStrategy();
    default:
      // Fallback to percentage if unknown type
      return new PercentagePriceOverrideStrategy();
  }
}

/**
 * Calculate price after applying price list override using strategy pattern
 * This replaces the if/else chain with polymorphic behavior
 */
export function calculatePriceAfterOverride(
  basePrice: number,
  override: PriceListOverride | null,
): number {
  if (!override) {
    return basePrice;
  }

  const strategy = getOverrideStrategy(override.overrideType);
  return strategy.calculate(basePrice, override.overrideValue);
}

