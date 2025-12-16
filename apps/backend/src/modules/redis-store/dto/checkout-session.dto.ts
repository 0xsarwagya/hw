import { CheckoutState } from "../constants/checkout-states";

/**
 * Checkout session data structure
 * Stored in Redis as the single source of truth
 * No derived state, no inference - explicit fields only
 */
export interface CheckoutSession {
  /**
   * Current state of the checkout session
   */
  state: CheckoutState;

  /**
   * Cart ID associated with this checkout session
   */
  cartId: string;

  /**
   * Payment intent ID (e.g., Razorpay order ID)
   * Set when payment intent is created
   */
  paymentIntentId: string | null;

  /**
   * Order ID created from this checkout
   * Set when order is created
   */
  orderId: string | null;

  /**
   * Timestamp of last state update
   * ISO 8601 format string
   */
  updatedAt: string;
}
