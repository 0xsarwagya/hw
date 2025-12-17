/**
 * Checkout metadata stored in Redis
 * Contains order creation data that needs to be preserved until payment confirmation
 */
export interface CheckoutMetadata {
  /**
   * User ID who initiated the checkout
   */
  userId: string;

  /**
   * Shipping address ID
   */
  shippingAddressId: string;

  /**
   * Billing address ID
   */
  billingAddressId: string;

  /**
   * Shipping cost in INR
   */
  shippingCost: number;

  /**
   * Timestamp when metadata was created
   * ISO 8601 format string
   */
  createdAt: string;
}
