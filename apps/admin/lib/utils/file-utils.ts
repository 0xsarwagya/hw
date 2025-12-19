/**
 * File utility functions
 * Centralized file-related helper functions
 */

import {
  STORAGE_IMAGE_EXTENSIONS,
  STORAGE_URL_TRUNCATE_LENGTH,
} from "@/lib/constants/storage.constants";

/**
 * Check if a file key/name represents an image file
 */
export function isImageFile(key: string): boolean {
  return STORAGE_IMAGE_EXTENSIONS.some((ext) =>
    key.toLowerCase().endsWith(ext),
  );
}

/**
 * Format file size in bytes to human-readable format (B, KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Truncate URL to specified length with ellipsis
 */
export function truncateUrl(
  url: string,
  maxLength: number = STORAGE_URL_TRUNCATE_LENGTH,
): string {
  if (url.length <= maxLength) return url;
  return `${url.substring(0, maxLength)}...`;
}
