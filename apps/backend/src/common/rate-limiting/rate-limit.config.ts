/**
 * Rate limit configuration presets for different endpoint types
 * Values are tuned for production traffic: 1-5K DAU, CDN caching, mobile apps
 */

export type RateLimitKeyType = "ip" | "sessionId" | "userId" | "ip+email";

export interface RateLimitConfig {
  limit: number;
  window: number; // in seconds
  keyType: RateLimitKeyType;
  skipIfAuthenticated?: boolean;
}

/**
 * Rate limit presets for different endpoint categories
 */
export const RATE_LIMIT_PRESETS = {
  /**
   * Storefront GET endpoints - high throughput for browsing
   */
  STOREFRONT_GET: {
    limit: 1000,
    window: 300, // 5 minutes
    keyType: "ip" as RateLimitKeyType,
  },

  /**
   * Product detail pages - high cache hit rate
   */
  PRODUCT_DETAIL: {
    limit: 1000,
    window: 300, // 5 minutes
    keyType: "ip" as RateLimitKeyType,
  },

  /**
   * Reviews listing - moderate traffic
   */
  REVIEWS_LISTING: {
    limit: 600,
    window: 300, // 5 minutes
    keyType: "ip" as RateLimitKeyType,
  },

  /**
   * Bundle listing - high throughput
   */
  BUNDLE_LISTING: {
    limit: 1000,
    window: 300, // 5 minutes
    keyType: "ip" as RateLimitKeyType,
  },

  /**
   * Categories, tags, search - moderate traffic
   */
  CATEGORIES_SEARCH: {
    limit: 800,
    window: 300, // 5 minutes
    keyType: "ip" as RateLimitKeyType,
  },

  /**
   * Checkout session creation - tighter limits to prevent abuse
   */
  CHECKOUT_SESSION: {
    limit: 50,
    window: 300, // 5 minutes
    keyType: "sessionId" as RateLimitKeyType,
  },

  /**
   * Payment intent creation - strictest checkout limit
   */
  PAYMENT_INTENT: {
    limit: 30,
    window: 300, // 5 minutes
    keyType: "sessionId" as RateLimitKeyType,
  },

  /**
   * Cart updates - moderate limits
   */
  CART_UPDATES: {
    limit: 300,
    window: 300, // 5 minutes
    keyType: "sessionId" as RateLimitKeyType,
  },

  /**
   * Login attempts - strict for brute force protection
   */
  LOGIN: {
    limit: 10,
    window: 600, // 10 minutes
    keyType: "ip+email" as RateLimitKeyType,
  },

  /**
   * Reset password - strict for security
   */
  RESET_PASSWORD: {
    limit: 8,
    window: 600, // 10 minutes
    keyType: "ip+email" as RateLimitKeyType,
  },

  /**
   * Claim account - strict for security
   */
  CLAIM_ACCOUNT: {
    limit: 8,
    window: 600, // 10 minutes
    keyType: "ip+email" as RateLimitKeyType,
  },

  /**
   * Admin GET endpoints - high throughput for admin UI
   */
  ADMIN_GET: {
    limit: 1000,
    window: 300, // 5 minutes
    keyType: "userId" as RateLimitKeyType,
  },

  /**
   * Admin POST/PATCH/DELETE - moderate limits
   */
  ADMIN_MUTATE: {
    limit: 200,
    window: 300, // 5 minutes
    keyType: "userId" as RateLimitKeyType,
  },

  /**
   * Generic store GET - catch-all fallback for public GET endpoints
   */
  GENERIC_STORE_GET: {
    limit: 1500,
    window: 300, // 5 minutes
    keyType: "ip" as RateLimitKeyType,
  },
} as const;
