/**
 * Abandoned checkouts TypeScript types
 * Based on carts with checkout state CREATED or LOCKED
 */

export type CheckoutState = "CREATED" | "LOCKED" | "COMPLETED" | "EXPIRED";

export interface BundleVariantBreakdown {
  variantId: string;
  unitPrice: number;
  quantity: number;
}

export interface CartItem {
  id: string;
  type: "variant" | "bundle";
  productVariantId: string;
  bundleId?: string;
  selections?: Record<string, string[]>;
  quantity: number;
  price: number;
  unitBundlePrice?: number;
  bundleVariantBreakdown?: BundleVariantBreakdown[];
  createdAt: Date;
  updatedAt: Date;
  // Extended fields
  productTitle?: string;
  variantTitle?: string;
  thumbnail?: string;
  bundleTitle?: string;
}

export interface GSTBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  isIntraState: boolean;
}

export interface AbandonedCheckout {
  id: string;
  cartId: string;
  customerId: string | null;
  sessionId: string | null;
  checkoutState: CheckoutState;
  subtotal: number;
  gstAmount: number;
  discountCode: string | null;
  discountAmount: number;
  gstBreakdown: GSTBreakdown;
  total: number;
  items: CartItem[];
  paymentIntentId: string | null;
  customerEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}

export interface PaginatedAbandonedCheckoutsResponse {
  data: AbandonedCheckout[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AbandonedCheckoutQueryParams {
  page?: number;
  limit?: number;
  recoverable?: boolean;
  hasEmail?: boolean;
  minValue?: number;
  maxValue?: number;
  state?: CheckoutState;
}
