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
   * Reserve inventory for a variant (atomic operation)
   * @param cartId - Cart ID (UUID)
   * @param variantId - Product variant ID
   * @param quantity - Quantity to reserve
   * @param ttlSeconds - Optional TTL for reservation (default: 15 minutes)
   */
  reserveInventory(
    cartId: string,
    variantId: string,
    quantity: number,
    ttlSeconds?: number,
  ): Promise<void>;

  /**
   * Refresh TTL for a reservation
   * @param cartId - Cart ID (UUID)
   * @param variantId - Product variant ID
   * @param ttlSeconds - Optional TTL override (default: 15 minutes)
   */
  refreshReservationTTL(
    cartId: string,
    variantId: string,
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

  /**
   * Get all reservations for a cart
   * @param cartId - Cart ID (UUID)
   * @returns Array of reservations with variantId and quantity
   */
  getCartReservations(
    cartId: string,
  ): Promise<Array<{ variantId: string; quantity: number }>>;

  /**
   * Release all reservations for a cart
   * @param cartId - Cart ID (UUID)
   */
  releaseCartReservations(cartId: string): Promise<void>;

  /**
   * Get a specific reservation
   * @param cartId - Cart ID (UUID)
   * @param variantId - Product variant ID
   * @returns Reservation quantity or null if not found
   */
  getReservation(cartId: string, variantId: string): Promise<number | null>;

  /**
   * Reconcile reservations (for recovery after Redis restart)
   * Detects and fixes expired reservations, orphaned reservations, negative states,
   * impossible states, and aggregated counter mismatches
   * @returns Object with detailed reconciliation metrics
   */
  reconcileReservations(): Promise<{
    released: number;
    inconsistencies: number;
    orphaned: number;
    negativeCorrections: number;
    variantsProcessed: number;
  }>;
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

  /**
   * Acquire checkout lock for a cart
   * Uses atomic Redis SET NX PX operation to prevent concurrent checkouts
   * @param cartId - Cart ID (UUID)
   * @param ttlMs - Optional TTL in milliseconds (default: 10 minutes)
   * @returns True if lock was acquired, false if cart is already locked
   */
  acquireCheckoutLock(cartId: string, ttlMs?: number): Promise<boolean>;

  /**
   * Release checkout lock for a cart
   * @param cartId - Cart ID (UUID)
   */
  releaseCheckoutLock(cartId: string): Promise<void>;

  /**
   * Check if a cart is currently locked for checkout
   * @param cartId - Cart ID (UUID)
   * @returns True if cart is locked, false otherwise
   */
  isCheckoutLocked(cartId: string): Promise<boolean>;

  /**
   * Create a new checkout session
   * Creates session in CREATED state
   * @param cartId - Cart ID (UUID)
   * @returns CheckoutSession with generated sessionId
   */
  createSession(cartId: string): Promise<{
    sessionId: string;
    session: import("../dto/checkout-session.dto").CheckoutSession;
  }>;

  /**
   * Get checkout session by session ID
   * @param sessionId - Checkout session ID (UUID)
   * @returns CheckoutSession or null if not found
   */
  getSession(
    sessionId: string,
  ): Promise<import("../dto/checkout-session.dto").CheckoutSession | null>;

  /**
   * Atomically transition checkout session state
   * Validates transition against allowlist and throws if invalid
   * @param sessionId - Checkout session ID
   * @param from - Expected current state
   * @param to - Target state
   * @throws Error if transition is invalid or session not found
   */
  transitionState(
    sessionId: string,
    from: import("../constants/checkout-states").CheckoutState,
    to: import("../constants/checkout-states").CheckoutState,
  ): Promise<void>;

  /**
   * Set payment intent ID in checkout session
   * @param sessionId - Checkout session ID
   * @param paymentIntentId - Payment intent ID (e.g., Razorpay order ID)
   */
  setPaymentIntent(sessionId: string, paymentIntentId: string): Promise<void>;

  /**
   * Set order ID in checkout session
   * @param sessionId - Checkout session ID
   * @param orderId - Order ID
   */
  setOrder(sessionId: string, orderId: string): Promise<void>;

  /**
   * Transition session to FAILED state and release checkout lock
   * Helper method for failure scenarios
   * @param sessionId - Checkout session ID
   */
  failSession(sessionId: string): Promise<void>;

  /**
   * Assert that session is in expected state
   * @param sessionId - Checkout session ID
   * @param expectedState - Expected state
   * @throws Error if state doesn't match
   */
  assertState(
    sessionId: string,
    expectedState: import("../constants/checkout-states").CheckoutState,
  ): Promise<void>;

  /**
   * Assert that session is in one of the allowed states
   * @param sessionId - Checkout session ID
   * @param allowedStates - Array of allowed states
   * @throws Error if state is not in allowed list
   */
  assertStateIn(
    sessionId: string,
    allowedStates: import("../constants/checkout-states").CheckoutState[],
  ): Promise<void>;

  /**
   * Get checkout session by order ID
   * Uses reverse lookup mapping
   * @param orderId - Order ID
   * @returns Session data with sessionId or null if not found
   */
  getSessionByOrderId(orderId: string): Promise<{
    sessionId: string;
    session: import("../dto/checkout-session.dto").CheckoutSession;
  } | null>;

  /**
   * Get payment intent for a checkout session
   * @param checkoutSessionId - Checkout session ID
   * @returns Payment intent or null if not found
   */
  getPaymentIntent(
    checkoutSessionId: string,
  ): Promise<import("../dto/payment-intent.dto").PaymentIntent | null>;

  /**
   * Create or get payment intent atomically
   * Ensures exactly one payment intent per checkout session
   * @param checkoutSessionId - Checkout session ID
   * @param createFn - Function to create payment intent (calls payment provider)
   * @returns Payment intent (existing or newly created)
   */
  createOrGetPaymentIntent(
    checkoutSessionId: string,
    createFn: () => Promise<import("../dto/payment-intent.dto").PaymentIntent>,
  ): Promise<import("../dto/payment-intent.dto").PaymentIntent>;

  /**
   * Update payment intent status
   * @param checkoutSessionId - Checkout session ID
   * @param status - New status (CONFIRMED or FAILED)
   */
  updatePaymentIntentStatus(
    checkoutSessionId: string,
    status: import("../dto/payment-intent.dto").PaymentIntentStatus,
  ): Promise<void>;

  /**
   * Get payment intent by payment intent ID (reverse lookup)
   * Used for webhook handling when checkoutSessionId is not available
   * @param paymentIntentId - Payment intent ID from provider
   * @returns Payment intent or null if not found
   */
  getPaymentIntentByPaymentId(
    paymentIntentId: string,
  ): Promise<import("../dto/payment-intent.dto").PaymentIntent | null>;
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
