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
 * Minimum refund amount in INR
 * Refunds below this amount are not allowed
 */
export const MIN_REFUND_AMOUNT_INR = 1.0;

