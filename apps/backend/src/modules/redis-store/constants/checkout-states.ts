/**
 * Checkout session states
 * These represent the explicit states in the checkout workflow
 */
export enum CheckoutState {
  CREATED = "CREATED",
  LOCKED = "LOCKED",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED",
  ORDER_CREATED = "ORDER_CREATED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

/**
 * Terminal states - cannot transition from these
 */
export const TERMINAL_STATES: CheckoutState[] = [
  CheckoutState.COMPLETED,
  CheckoutState.FAILED,
];

/**
 * Explicit transition rules
 * Maps from state to allowed next states
 * If a transition is not in this table, it is illegal and will throw
 */
export const TRANSITION_RULES: Record<CheckoutState, CheckoutState[]> = {
  [CheckoutState.CREATED]: [CheckoutState.LOCKED, CheckoutState.FAILED], // Allow CREATED → FAILED for cleanup
  // LOCKED can transition to:
  // - PAYMENT_PENDING: For online payments (normal flow)
  // - PAYMENT_CONFIRMED: For COD orders (COD selection = payment confirmation)
  // - FAILED: For error cases
  [CheckoutState.LOCKED]: [
    CheckoutState.PAYMENT_PENDING,
    CheckoutState.PAYMENT_CONFIRMED, // Allow COD orders to skip PAYMENT_PENDING
    CheckoutState.FAILED,
  ],
  [CheckoutState.PAYMENT_PENDING]: [
    CheckoutState.PAYMENT_CONFIRMED,
    CheckoutState.FAILED,
  ],
  [CheckoutState.PAYMENT_CONFIRMED]: [CheckoutState.ORDER_CREATED],
  [CheckoutState.ORDER_CREATED]: [CheckoutState.COMPLETED],
  [CheckoutState.COMPLETED]: [], // Terminal - no transitions allowed
  [CheckoutState.FAILED]: [], // Terminal - no transitions allowed
};

/**
 * Check if a transition is allowed
 */
export function isTransitionAllowed(
  from: CheckoutState,
  to: CheckoutState,
): boolean {
  // Same state transitions are allowed (idempotent)
  if (from === to) {
    return true;
  }

  // Check if transition is in allowlist
  const allowedStates = TRANSITION_RULES[from];
  return allowedStates.includes(to);
}

/**
 * Validate transition and throw if invalid
 */
export function validateTransition(
  from: CheckoutState,
  to: CheckoutState,
): void {
  if (!isTransitionAllowed(from, to)) {
    throw new Error(
      `Invalid state transition: ${from} → ${to}. Allowed transitions from ${from}: ${TRANSITION_RULES[from].join(", ") || "none"}`,
    );
  }
}
