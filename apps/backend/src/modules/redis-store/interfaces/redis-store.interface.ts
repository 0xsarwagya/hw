/**
 * Base interface for Redis stores
 *
 * All stores should implement common methods for basic operations
 */
export interface IRedisStore {
  /**
   * Get a value from Redis
   * @param key - Redis key
   * @returns Value or null if not found
   */
  get<T = string>(key: string): Promise<T | null>;

  /**
   * Set a value in Redis
   * @param key - Redis key
   * @param value - Value to store
   * @param ttlSeconds - Optional TTL in seconds
   */
  set(
    key: string,
    value: string | number | object,
    ttlSeconds?: number,
  ): Promise<void>;

  /**
   * Delete a key from Redis
   * @param key - Redis key
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a key exists in Redis
   * @param key - Redis key
   * @returns True if key exists, false otherwise
   */
  exists(key: string): Promise<boolean>;
}

/**
 * Inventory store interface
 */
export interface IInventoryStore extends IRedisStore {
  /**
   * Reserve inventory for a variant
   * @param variantId - Product variant ID
   * @param quantity - Quantity to reserve
   * @param ttlSeconds - Optional TTL for reservation (default: 15 minutes)
   */
  reserveInventory(
    variantId: string,
    quantity: number,
    ttlSeconds?: number,
  ): Promise<void>;

  /**
   * Release reserved inventory (returns to available)
   * Use this for cart removals or TTL expiry
   * @param variantId - Product variant ID
   * @param quantity - Quantity to release
   */
  releaseInventory(variantId: string, quantity: number): Promise<void>;

  /**
   * Commit reservation (convert reserved → consumed)
   * Use this when an order is created to consume the reserved inventory
   * @param variantId - Product variant ID
   * @param quantity - Quantity to commit
   */
  commitReservation(variantId: string, quantity: number): Promise<void>;

  /**
   * Get available inventory count
   * @param variantId - Product variant ID
   * @returns Available inventory count
   */
  getAvailableInventory(variantId: string): Promise<number | null>;

  /**
   * Set inventory count (for sync with DB)
   * @param variantId - Product variant ID
   * @param quantity - Inventory quantity
   */
  setInventory(variantId: string, quantity: number): Promise<void>;

  /**
   * Increment/decrement inventory
   * @param variantId - Product variant ID
   * @param delta - Amount to change (positive or negative)
   */
  incrementInventory(variantId: string, delta: number): Promise<number>;

  /**
   * Get reserved inventory count
   * @param variantId - Product variant ID
   * @returns Reserved inventory count
   */
  getReservedInventory(variantId: string): Promise<number>;
}

/**
 * Cart store interface
 */
export interface ICartStore extends IRedisStore {
  /**
   * Get cart data
   * @param customerId - Customer ID (if authenticated)
   * @param sessionId - Session ID (if guest)
   */
  getCart(
    customerId: string | null,
    sessionId: string | null,
  ): Promise<unknown | null>;

  /**
   * Store cart data
   * @param customerId - Customer ID (if authenticated)
   * @param sessionId - Session ID (if guest)
   * @param cartData - Cart data to store
   * @param ttlSeconds - Optional TTL override
   */
  setCart(
    customerId: string | null,
    sessionId: string | null,
    cartData: unknown,
    ttlSeconds?: number,
  ): Promise<void>;

  /**
   * Remove cart
   * @param customerId - Customer ID (if authenticated)
   * @param sessionId - Session ID (if guest)
   */
  deleteCart(
    customerId: string | null,
    sessionId: string | null,
  ): Promise<void>;

  /**
   * Extend cart expiration
   * @param customerId - Customer ID (if authenticated)
   * @param sessionId - Session ID (if guest)
   */
  extendCartTTL(
    customerId: string | null,
    sessionId: string | null,
  ): Promise<void>;

  /**
   * Check if cart exists
   * @param customerId - Customer ID (if authenticated)
   * @param sessionId - Session ID (if guest)
   */
  cartExists(
    customerId: string | null,
    sessionId: string | null,
  ): Promise<boolean>;
}

/**
 * Checkout store interface
 */
export interface ICheckoutStore extends IRedisStore {
  /**
   * Create checkout session
   * @param sessionId - Session ID
   * @param checkoutData - Checkout session data
   */
  createCheckoutSession(
    sessionId: string,
    checkoutData: unknown,
  ): Promise<void>;

  /**
   * Retrieve checkout session
   * @param sessionId - Session ID
   */
  getCheckoutSession(sessionId: string): Promise<unknown | null>;

  /**
   * Update checkout session data
   * @param sessionId - Session ID
   * @param updates - Partial checkout data to update
   */
  updateCheckoutSession(
    sessionId: string,
    updates: Partial<unknown>,
  ): Promise<void>;

  /**
   * Remove checkout session
   * @param sessionId - Session ID
   */
  deleteCheckoutSession(sessionId: string): Promise<void>;

  /**
   * Extend session TTL
   * @param sessionId - Session ID
   */
  extendSession(sessionId: string): Promise<void>;
}

/**
 * Idempotency store interface
 */
export interface IIdempotencyStore extends IRedisStore {
  /**
   * Atomic check-and-set for idempotency
   * Returns true if key was set (first request), false if already exists
   * @param operation - Operation name (e.g., "order:create", "payment:process")
   * @param key - Idempotency key (unique identifier for the request)
   * @param value - Value to store
   * @param ttlSeconds - Optional TTL override
   * @returns True if key was set, false if already exists
   */
  checkAndSet(
    operation: string,
    key: string,
    value: string | number | object,
    ttlSeconds?: number,
  ): Promise<boolean>;

  /**
   * Get idempotency result
   * @param operation - Operation name
   * @param key - Idempotency key
   */
  getIdempotencyResult<T = unknown>(
    operation: string,
    key: string,
  ): Promise<T | null>;

  /**
   * Check if idempotency key exists
   * @param operation - Operation name
   * @param key - Idempotency key
   */
  idempotencyExists(operation: string, key: string): Promise<boolean>;

  /**
   * Remove idempotency key
   * @param operation - Operation name
   * @param key - Idempotency key
   */
  deleteIdempotency(operation: string, key: string): Promise<void>;
}
