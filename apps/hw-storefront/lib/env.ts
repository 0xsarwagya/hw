/**
 * Environment variable validation and access for HW Storefront
 * Validates required environment variables at runtime
 */

const API_URL_PATTERN = /^https?:\/\/.+/;

/**
 * Validate that VITE_API_URL is set and is a valid URL
 */
function validateApiUrl(url: string | undefined, name: string): string {
  if (!url) {
    throw new Error(
      `Missing required environment variable: ${name}. Please set it in Netlify project settings or .env file.`,
    );
  }

  if (!API_URL_PATTERN.test(url)) {
    throw new Error(
      `Invalid ${name} format: "${url}". Must be a valid HTTP/HTTPS URL (e.g., https://api.example.com)`,
    );
  }

  return url;
}

/**
 * Get the API base URL
 * Validates the URL format and ensures it's set
 */
export function getApiUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  return validateApiUrl(url, "VITE_API_URL");
}

/**
 * Get Razorpay Key ID
 * Returns undefined if not set (optional for some features)
 */
export function getRazorpayKeyId(): string | undefined {
  return import.meta.env.VITE_RAZORPAY_KEY_ID;
}

/**
 * Validate all required environment variables
 * Call this at app startup to fail fast if env vars are missing
 */
export function validateEnv(): void {
  // Only validate in production - allow dev builds without env vars
  if (import.meta.env.PROD) {
    getApiUrl();
  }
}

/**
 * Environment configuration object
 */
export const env = {
  /**
   * Backend API URL (required)
   */
  get apiUrl() {
    return getApiUrl();
  },

  /**
   * Razorpay Key ID (optional)
   */
  get razorpayKeyId() {
    return getRazorpayKeyId();
  },

  /**
   * Check if running in production
   */
  get isProduction() {
    return import.meta.env.PROD;
  },

  /**
   * Check if running in development
   */
  get isDevelopment() {
    return import.meta.env.DEV;
  },
} as const;

