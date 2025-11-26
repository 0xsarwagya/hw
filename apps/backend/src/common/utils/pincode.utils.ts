/**
 * PIN code (Postal Index Number) utility functions for India
 * Provides validation and utilities for Indian PIN codes
 */

/**
 * Validate PIN code format
 * Indian PIN codes are 6 digits
 * @param pincode - PIN code to validate
 * @returns true if format is valid, false otherwise
 */
export function isValidPincodeFormat(pincode: string): boolean {
  if (!pincode || typeof pincode !== "string") {
    return false;
  }

  // Remove spaces and check if exactly 6 digits
  const cleaned = pincode.trim().replace(/\s+/g, "");

  // PIN code must be exactly 6 digits
  if (cleaned.length !== 6) {
    return false;
  }

  // Must be all digits
  const pincodePattern = /^\d{6}$/;
  return pincodePattern.test(cleaned);
}

/**
 * Format PIN code (remove spaces, ensure 6 digits)
 * @param pincode - PIN code to format
 * @returns Formatted PIN code
 */
export function formatPincode(pincode: string): string {
  if (!pincode) {
    return "";
  }
  return pincode.trim().replace(/\s+/g, "");
}

/**
 * Extract state code from PIN code (first digit)
 * Note: This is a simplified mapping. Full state mapping requires a database.
 * @param pincode - PIN code
 * @returns First digit (1-9) or null if invalid
 */
export function extractStateCodeFromPincode(pincode: string): number | null {
  if (!isValidPincodeFormat(pincode)) {
    return null;
  }
  const cleaned = formatPincode(pincode);
  const firstDigit = parseInt(cleaned.substring(0, 1), 10);
  return firstDigit >= 1 && firstDigit <= 9 ? firstDigit : null;
}
