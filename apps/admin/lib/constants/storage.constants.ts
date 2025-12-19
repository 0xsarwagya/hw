/**
 * Constants for storage-related functionality
 * Centralizes magic numbers and strings to improve maintainability
 */

export const STORAGE_DEBOUNCE_DELAY_MS = 300;
export const STORAGE_URL_TRUNCATE_LENGTH = 50;

export const STORAGE_EMPTY_STATE_TITLE = "No files found";
export const STORAGE_EMPTY_STATE_DESCRIPTION = "Upload files to get started";

export const STORAGE_DELETE_DIALOG_TITLE = "Delete File";
export const STORAGE_DELETE_DIALOG_DESCRIPTION =
  "Are you sure you want to delete this file? This action cannot be undone.";

export const STORAGE_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
];

// File size constants (in bytes)
export const FILE_SIZE = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
} as const;

// MIME type mappings
export const MIME_TYPES = {
  IMAGE: {
    JPEG: "image/jpeg",
    PNG: "image/png",
    GIF: "image/gif",
    WEBP: "image/webp",
    SVG: "image/svg+xml",
  },
  APPLICATION: {
    PDF: "application/pdf",
    JSON: "application/json",
  },
} as const;

// File type categories
export const FILE_TYPE_CATEGORIES = {
  IMAGE: "image",
  DOCUMENT: "document",
  OTHER: "other",
} as const;
