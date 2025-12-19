/**
 * Payment-related constants
 * Centralizes payment methods and related strings
 */

// Payment Methods
export const PAYMENT_METHODS = {
  COD: "COD" as const,
  RAZORPAY: "razorpay" as const,
  CARD: "card" as const,
  UPI: "upi" as const,
  NETBANKING: "netbanking" as const,
  WALLET: "wallet" as const,
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Cash on Delivery",
  razorpay: "Razorpay",
  card: "Card",
  upi: "UPI",
  netbanking: "Net Banking",
  wallet: "Wallet",
};

// Payment Providers
export const PAYMENT_PROVIDERS = {
  RAZORPAY: "razorpay" as const,
} as const;

// Payment-related Messages
export const PAYMENT_MESSAGES = {
  COD_CAPTURE_COMING_SOON: "COD payment capture feature coming soon",
  NO_PAYMENT_INTENT_ID: "No payment intent ID found",
  PAYMENT_METHOD_NA: "N/A",
} as const;
