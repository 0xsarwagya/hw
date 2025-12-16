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
   * Reserved inventory keys (aggregated per variant)
   * Format: inventory:reserved:{variantId}
   * TTL: None (persistent, managed separately)
   */
  INVENTORY_RESERVED: (variantId: string) => `inventory:reserved:${variantId}`,

  /**
   * Individual reservation keys (per cart/variant)
   * Format: inventory:reservation:{cartId}:{variantId}
   * TTL: 15 minutes (default), refreshed on cart updates
   */
  INVENTORY_RESERVATION: (cartId: string, variantId: string) =>
    `inventory:reservation:${cartId}:${variantId}`,

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

  /**
   * Checkout lock keys
   * Format: checkout:lock:{cartId}
   * TTL: 10 minutes (default)
   */
  CHECKOUT_LOCK: (cartId: string) => `checkout:lock:${cartId}`,

  /**
   * Checkout session by order ID (reverse lookup)
   * Format: checkout:session:by-order:{orderId}
   * TTL: Same as checkout session (1 hour)
   */
  CHECKOUT_SESSION_BY_ORDER: (orderId: string) =>
    `checkout:session:by-order:${orderId}`,

  /**
   * Payment intent keys
   * Format: payment:intent:{checkoutSessionId}
   * TTL: 24 hours (must not expire before checkout completion)
   */
  PAYMENT_INTENT: (checkoutSessionId: string) =>
    `payment:intent:${checkoutSessionId}`,

  /**
   * Payment intent by payment ID (reverse lookup)
   * Format: payment:intent:by-id:{paymentIntentId}
   * TTL: Same as payment intent (24 hours)
   */
  PAYMENT_INTENT_BY_ID: (paymentIntentId: string) =>
    `payment:intent:by-id:${paymentIntentId}`,
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

  /**
   * Checkout lock TTL: 10 minutes
   * Used to prevent concurrent checkout attempts on the same cart
   */
  CHECKOUT_LOCK: 10 * 60, // 10 minutes in seconds

  /**
   * Payment intent TTL: 24 hours
   * Must not expire before checkout completion
   */
  PAYMENT_INTENT: 24 * 60 * 60, // 24 hours in seconds
} as const;
