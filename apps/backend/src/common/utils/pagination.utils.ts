/**
 * Pagination utility functions
 * Supports both page-based and cursor-based pagination
 */

/**
 * Calculate offset from page and limit
 * @param page - Page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Offset value for database queries
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calculate total pages from total items and limit
 * @param total - Total number of items
 * @param limit - Number of items per page
 * @returns Total number of pages
 */
export function calculateTotalPages(total: number, limit: number): number {
  if (limit <= 0) {
    return 0;
  }
  return Math.ceil(total / limit);
}

/**
 * Validate pagination parameters
 * @param page - Page number
 * @param limit - Items per page
 * @param maxLimit - Maximum allowed limit
 * @returns Validation result
 */
export function validatePaginationParams(
  page: number,
  limit: number,
  maxLimit = 100,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (page < 1) {
    errors.push("Page must be greater than or equal to 1");
  }

  if (limit < 1) {
    errors.push("Limit must be greater than or equal to 1");
  }

  if (limit > maxLimit) {
    errors.push(`Limit must be less than or equal to ${maxLimit}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Normalize pagination parameters with defaults
 * @param page - Page number (optional)
 * @param limit - Items per page (optional)
 * @param defaultPage - Default page number
 * @param defaultLimit - Default limit
 * @param maxLimit - Maximum allowed limit
 * @returns Normalized pagination parameters
 */
export function normalizePaginationParams(
  page?: number,
  limit?: number,
  defaultPage = 1,
  defaultLimit = 10,
  maxLimit = 100,
): { page: number; limit: number; offset: number } {
  const normalizedPage = page && page >= 1 ? page : defaultPage;
  let normalizedLimit: number;
  if (limit && limit >= 1) {
    normalizedLimit = limit > maxLimit ? maxLimit : limit;
  } else {
    normalizedLimit = defaultLimit;
  }

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    offset: calculateOffset(normalizedPage, normalizedLimit),
  };
}

/**
 * Generate pagination metadata
 * @param total - Total number of items
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Pagination metadata
 */
export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function generatePaginationMetadata(
  total: number,
  page: number,
  limit: number,
): PaginationMetadata {
  const totalPages = calculateTotalPages(total, limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Cursor-based pagination utilities
 */

/**
 * Encode cursor from a value (typically ID or timestamp)
 * @param value - Value to encode as cursor
 * @returns Base64 encoded cursor string
 */
export function encodeCursor(value: string | number | Date): string {
  const str = value instanceof Date ? value.toISOString() : String(value);
  return Buffer.from(str).toString("base64url");
}

/**
 * Decode cursor to original value
 * @param cursor - Base64 encoded cursor string
 * @returns Decoded value as string
 */
export function decodeCursor(cursor: string): string {
  // Check if cursor contains invalid base64url characters
  if (!/^[A-Za-z0-9_-]+$/.test(cursor)) {
    throw new Error("Invalid cursor format");
  }
  try {
    return Buffer.from(cursor, "base64url").toString("utf-8");
  } catch (_error) {
    throw new Error("Invalid cursor format");
  }
}

/**
 * Generate cursor from item (for cursor-based pagination)
 * @param item - Item to generate cursor from
 * @param cursorField - Field to use for cursor (default: 'id')
 * @returns Cursor string
 */
export function generateCursor<T extends Record<string, unknown>>(
  item: T,
  cursorField = "id",
): string {
  const value = item[cursorField];
  if (value === undefined || value === null) {
    throw new Error(`Cursor field '${cursorField}' not found in item`);
  }
  return encodeCursor(value as string | number | Date);
}

/**
 * Cursor-based pagination metadata
 */
export interface CursorPaginationMetadata {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
}

/**
 * Generate cursor-based pagination metadata
 * @param items - Array of items
 * @param limit - Requested limit
 * @param cursorField - Field to use for cursor
 * @returns Cursor pagination metadata
 */
export function generateCursorPaginationMetadata<
  T extends Record<string, unknown>,
>(items: T[], limit: number, cursorField = "id"): CursorPaginationMetadata {
  const hasNextPage = items.length > limit;
  const hasPreviousPage = false; // We don't track previous page in forward pagination

  // Remove extra item if we fetched one more to check for next page
  const actualItems = hasNextPage ? items.slice(0, limit) : items;

  const startCursor =
    actualItems.length > 0
      ? generateCursor(actualItems[0], cursorField)
      : undefined;
  const endCursor =
    actualItems.length > 0
      ? generateCursor(actualItems[actualItems.length - 1], cursorField)
      : undefined;

  return {
    hasNextPage,
    hasPreviousPage,
    startCursor,
    endCursor,
  };
}

/**
 * Parse cursor for database queries
 * @param cursor - Cursor string
 * @param cursorField - Field type (id, date, etc.)
 * @returns Parsed cursor value
 */
export function parseCursor(
  cursor: string,
  cursorField: "id" | "date" | "number" = "id",
): string | number | Date {
  const decoded = decodeCursor(cursor);

  if (cursorField === "date") {
    return new Date(decoded);
  }

  if (cursorField === "number") {
    const num = Number(decoded);
    if (Number.isNaN(num)) {
      throw new Error("Invalid number cursor");
    }
    return num;
  }

  return decoded;
}
