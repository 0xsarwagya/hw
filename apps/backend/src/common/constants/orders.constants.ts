/**
 * Order management constants
 * Configuration values for order operations including refunds and payments
 */

/**
 * Maximum refund amount multiplier
 * Refunds cannot exceed this percentage of the original order total
 * Set to 1.0 (100%) to allow full refunds, or lower to cap refund amounts
 */
export const MAX_REFUND_AMOUNT_MULTIPLIER = 1.0;

/**
 * Refund processing timeout in milliseconds
 * Maximum time to wait for payment provider to process a refund
 * After this timeout, refund status is marked as failed
 */
export const REFUND_PROCESSING_TIMEOUT_MS = 30000; // 30 seconds

/**
 * COD payment method identifier
 * Used to identify Cash on Delivery orders
 */
export const COD_PAYMENT_METHOD = "cod";

/**
 * Valid COD payment method variations
 * These are all acceptable values that should be treated as COD
 */
const COD_VARIATIONS = [
  "cod",
  "COD",
  "cash_on_delivery",
  "cash on delivery",
  "Cash on Delivery",
  "CASH_ON_DELIVERY",
];

/**
 * Check if a payment method is COD (Cash on Delivery)
 * Handles case-insensitive comparison and multiple COD format variations
 *
 * @param paymentMethod - The payment method string to check
 * @returns true if the payment method is COD, false otherwise
 *
 * @example
 * isCodPayment("COD") // true
 * isCodPayment("cod") // true
 * isCodPayment("Cash on Delivery") // true
 * isCodPayment("razorpay") // false
 * isCodPayment(null) // false
 * isCodPayment("") // false
 */
export function isCodPayment(
  paymentMethod: string | undefined | null,
): boolean {
  // Handle null, undefined, or non-string values
  if (!paymentMethod || typeof paymentMethod !== "string") {
    return false;
  }

  // Normalize: trim whitespace and convert to lowercase
  const normalizedMethod = paymentMethod.trim().toLowerCase();

  // Check against all COD variations
  return COD_VARIATIONS.some(
    (variation) => variation.toLowerCase() === normalizedMethod,
  );
}

/**
 * Minimum refund amount in INR
 * Refunds below this amount are not allowed
 */
export const MIN_REFUND_AMOUNT_INR = 1.0;
