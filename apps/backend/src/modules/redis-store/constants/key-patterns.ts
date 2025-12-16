/**
 * Redis key naming conventions and TTL rules
 *
 * All keys follow the pattern: {store}:{type}:{identifier}
 */

export const KEY_PATTERNS = {
  /**
   * Inventory keys
   * Format: inventory:variant:{variantId}
   * TTL: None (persistent)
   */
  INVENTORY_VARIANT: (variantId: string) => `inventory:variant:${variantId}`,

  /**
   * Reserved inventory keys
   * Format: inventory:reserved:{variantId}
   * TTL: None (persistent, managed separately)
   */
  INVENTORY_RESERVED: (variantId: string) => `inventory:reserved:${variantId}`,

  /**
   * Cart keys for customers
   * Format: cart:customer:{customerId}
   * TTL: 30 days
   */
  CART_CUSTOMER: (customerId: string) => `cart:customer:${customerId}`,

  /**
   * Cart keys for sessions
   * Format: cart:session:{sessionId}
   * TTL: 30 days
   */
  CART_SESSION: (sessionId: string) => `cart:session:${sessionId}`,

  /**
   * Checkout session keys
   * Format: checkout:session:{sessionId}
   * TTL: 1 hour
   */
  CHECKOUT_SESSION: (sessionId: string) => `checkout:session:${sessionId}`,

  /**
   * Idempotency keys
   * Format: idempotency:{operation}:{key}
   * TTL: 24 hours
   */
  IDEMPOTENCY: (operation: string, key: string) =>
    `idempotency:${operation}:${key}`,
} as const;

/**
 * TTL values in seconds
 */
export const TTL = {
  /**
   * Cart expiration: 30 days
   */
  CART: 30 * 24 * 60 * 60, // 30 days in seconds

  /**
   * Checkout session expiration: 1 hour
   */
  CHECKOUT_SESSION: 60 * 60, // 1 hour in seconds

  /**
   * Idempotency key expiration: 24 hours
   */
  IDEMPOTENCY: 24 * 60 * 60, // 24 hours in seconds

  /**
   * Inventory reservation TTL: 15 minutes (default)
   * Used for temporary inventory reservations during checkout
   */
  INVENTORY_RESERVATION: 15 * 60, // 15 minutes in seconds
} as const;
