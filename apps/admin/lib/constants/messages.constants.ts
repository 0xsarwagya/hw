/**
 * Toast and user-facing messages constants
 * Centralizes all success, error, and info messages
 */

export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: "File uploaded successfully",
  IMAGE_UPLOADED: "Image uploaded successfully",
  COPIED_TO_CLIPBOARD: (label: string) => `${label} copied to clipboard`,
  SHIPMENT_CREATED: (awbNumber: string) => `Shipment created: ${awbNumber}`,
} as const;

export const ERROR_MESSAGES = {
  FAILED_TO_COPY: "Failed to copy to clipboard",
  FAILED_TO_UPLOAD_FILE: "Failed to upload file",
  FAILED_TO_UPLOAD_IMAGE: (fileName?: string) =>
    fileName ? `Failed to upload ${fileName}` : "Failed to upload image",
  ERROR_UPLOADING_FILE: "Error uploading file. Please try again.",
  FAILED_TO_LOAD_ORDER: "Failed to load order",
  FAILED_TO_LOAD_CATEGORIES: "Failed to load categories",
  FAILED_TO_LOAD_COLLECTIONS: "Failed to load collections",
  NO_PAYMENT_INTENT_ID: "No payment intent ID found",
  ERROR_LOADING_ABANDONED_CHECKOUTS: "Error loading abandoned checkouts",
  UNKNOWN_ERROR: "Unknown error occurred",
} as const;

export const INFO_MESSAGES = {
  COD_CAPTURE_COMING_SOON: "COD payment capture feature coming soon",
  REQUEST_TIMED_OUT:
    "The request timed out. This might happen if there are many checkout sessions to scan.",
} as const;
