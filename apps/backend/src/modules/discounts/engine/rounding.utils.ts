/**
 * Rounding utilities for discount calculations
 * Ensures consistent 2-decimal precision
 */

/**
 * Round to 2 decimal places
 * Used at final per-line discount calculation
 */
export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Ensure value never goes below 0
 */
export function ensureNonNegative(value: number): number {
  return Math.max(0, value);
}

/**
 * Round and ensure non-negative in one operation
 */
export function roundAndEnsureNonNegative(value: number): number {
  return ensureNonNegative(roundToTwoDecimals(value));
}
