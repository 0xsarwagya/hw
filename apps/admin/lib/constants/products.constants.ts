/**
 * Constants for product-related functionality
 * Centralizes magic numbers and strings to improve maintainability
 */

export const PRODUCT_DEFAULT_PAGE = 1;
export const PRODUCT_DEFAULT_LIMIT = 10;
export const PRODUCT_DEFAULT_SORT_BY = "date" as const;
export const PRODUCT_DEFAULT_SORT_ORDER = "desc" as const;

export const PRODUCT_PLACEHOLDER_IMAGE_URL =
  "https://vestcodes.co/_next/image?url=%2Flogo%2Fblack-logo.avif&w=64&q=75";

export const PRODUCT_DELETE_CONFIRMATION_MESSAGE =
  "Are you sure you want to delete this product? This action cannot be undone.";

export const PRODUCT_EMPTY_STATE_TITLE = "No products found";
export const PRODUCT_EMPTY_STATE_DESCRIPTION =
  "Get started by creating your first product";
