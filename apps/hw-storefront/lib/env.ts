/**
 * Environment variable validation and access for HW Storefront
 * Validates required environment variables at runtime
 */

const API_URL_PATTERN = /^https?:\/\/.+/;

/**
 * Validate that NEXT_PUBLIC_API_URL is set and is a valid URL
 */
function validateApiUrl(url: string | undefined, name: string): string {
  if (!url) {
    throw new Error(
      `Missing required environment variable: ${name}. Please set it in Netlify project settings or .env.local file.`,
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
 * Returns a default URL during build time if not set
 */
export function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  // During build, allow missing env var (will be set at runtime)
  if (process.env.NODE_ENV === "production" && !url) {
    return "http://localhost:3001"; // Fallback for build
  }
  return validateApiUrl(url, "NEXT_PUBLIC_API_URL");
}

/**
 * Get Razorpay Key ID
 * Returns undefined if not set (optional for some features)
 */
export function getRazorpayKeyId(): string | undefined {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
}

/**
 * Validate all required environment variables
 * Call this at app startup to fail fast if env vars are missing
 */
export function validateEnv(): void {
  // Only validate in production - allow dev builds without env vars
  if (process.env.NODE_ENV === "production") {
    getApiUrl();
  }
}

/**
 * Environment configuration object
 */
export const env = {
  /**
   * Backend API URL (required)
   * Returns fallback during build if not set
   */
  get apiUrl() {
    // During build, allow missing env var
    if (
      process.env.NODE_ENV === "production" &&
      !process.env.NEXT_PUBLIC_API_URL
    ) {
      return "http://localhost:3001"; // Fallback for build
    }
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
    return process.env.NODE_ENV === "production";
  },

  /**
   * Check if running in development
   */
  get isDevelopment() {
    return process.env.NODE_ENV === "development";
  },
} as const;
