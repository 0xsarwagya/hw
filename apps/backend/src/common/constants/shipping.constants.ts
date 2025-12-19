/**
 * Shipping configuration constants
 * Default values for shipping calculations and zone-based rates
 */

/**
 * Default fallback shipping rate in INR when zone rates are not found in database
 */
export const DEFAULT_FALLBACK_SHIPPING_RATE_INR = 100;

/**
 * Default shipping zone when zone information is not available
 */
export const DEFAULT_SHIPPING_ZONE = "zone_c";

/**
 * Estimated delivery days by shipping zone (fallback values)
 * Used when zone rates are not found in database
 */
export const ESTIMATED_DELIVERY_DAYS_BY_ZONE: Record<string, number> = {
  metro: 2,
  zone_a: 3,
  zone_b: 4,
  zone_c: 5,
  zone_d: 6,
  zone_e: 7,
} as const;

/**
 * Weight conversion factor: grams to kilograms
 * Used for calculating excess weight charges
 */
export const GRAMS_PER_KILOGRAM = 1000;

/**
 * Default weight increment for shipping rate calculation (in grams)
 * Used in zone-based rate calculations
 */
export const DEFAULT_WEIGHT_INCREMENT_GRAMS = 500;

