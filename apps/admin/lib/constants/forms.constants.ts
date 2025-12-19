/**
 * Form field labels, placeholders, and validation messages
 * Centralizes all form-related strings
 */

export const FIELD_LABELS = {
  // Product fields
  TITLE: "Title",
  DESCRIPTION: "Description",
  PRICE: "Price",
  BASE_PRICE: "Base Price (INR)",
  COMPARE_AT_PRICE: "Compare-at Price (INR)",
  SALE_PRICE: "Sale Price (INR)",
  SALE_START_DATE: "Sale Start Date",
  SALE_END_DATE: "Sale End Date",
  GST_RATE: "GST Rate",
  HSN_CODE: "HSN Code",
  STATUS: "Status",
  CATEGORY: "Category",
  SKU: "SKU",
  INVENTORY: "Inventory",
  INITIAL_INVENTORY: "Initial Inventory",
  SIZE: "Size",
  COLOR: "Color",
  WEIGHT: "Weight (kg)",
  // Variant fields
  VARIANT_OPTIONS: "Variant Options",
  VARIANT_INFORMATION: "Variant Information",
  // Category fields
  CATEGORY_NAME: "Category Name",
  CATEGORY_DESCRIPTION: "Category Description",
  CATEGORY_IMAGE: "Category Image",
  // Collection fields
  COLLECTION_NAME: "Collection Name",
  COLLECTION_DESCRIPTION: "Collection Description",
  COLLECTION_COVER: "Collection Cover Image",
  // Filter fields
  FILTER_BY_PREFIX: "Filter by prefix",
  SEARCH: "Search",
  RECOVERABLE: "Recoverable",
  HAS_EMAIL: "Has Email",
  MIN_VALUE: "Min value",
} as const;

export const PLACEHOLDERS = {
  // Product placeholders
  PRODUCT_TITLE: "Product title",
  PRODUCT_DESCRIPTION: "Product description",
  PRICE: "0.00",
  SKU: "SKU",
  SKU_AUTO_GENERATED: "Auto-generated if empty",
  HSN_CODE: "HSN Code",
  // Variant placeholders
  SIZE: "Size",
  COLOR: "Color",
  WEIGHT: "0.00",
  INVENTORY: "0",
  // Category placeholders
  CATEGORY_NAME: "Category name",
  CATEGORY_DESCRIPTION: "Category description",
  // Collection placeholders
  COLLECTION_NAME: "Collection name",
  COLLECTION_DESCRIPTION: "Collection description",
  // Filter placeholders
  PREFIX_FILTER: "products, categories, collections, etc.",
  SEARCH: "Search...",
  MIN_VALUE: "Min value",
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: "This field is required",
  INVALID_EMAIL: "Please enter a valid email address",
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be at most ${max} characters`,
  MIN_VALUE: (min: number) => `Must be at least ${min}`,
  MAX_VALUE: (max: number) => `Must be at most ${max}`,
  INVALID_NUMBER: "Please enter a valid number",
  INVALID_URL: "Please enter a valid URL",
} as const;

export const FIELD_DESCRIPTIONS = {
  SKU_AUTO_GENERATED: "Leave empty to auto-generate SKU",
  VARIANT_OPTIONS_DESCRIPTION:
    "Select one value for each option type to define this variant",
  NO_VARIANT_OPTIONS:
    "This product doesn't have any variant option types configured. You can create a variant without options, or add option types first.",
  VARIANT_IMAGES_OPTIONAL:
    "Variant images are optional. You can add them later if needed.",
} as const;
