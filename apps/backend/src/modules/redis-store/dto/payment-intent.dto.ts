/**
 * Payment Intent DTO
 * Represents a payment intent stored in Redis
 */
export enum PaymentIntentStatus {
  CREATED = "CREATED",
  CONFIRMED = "CONFIRMED",
  FAILED = "FAILED",
}

export interface PaymentIntent {
  /**
   * Payment provider (e.g., "razorpay")
   */
  paymentProvider: string;

  /**
   * Payment intent ID from provider (e.g., Razorpay order ID)
   */
  paymentIntentId: string;

  /**
   * Current status of the payment intent
   */
  status: PaymentIntentStatus;

  /**
   * ISO timestamp when payment intent was created
   */
  createdAt: string;

  /**
   * ISO timestamp when payment intent was last updated
   */
  updatedAt: string;
}
