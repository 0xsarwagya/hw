/**
 * GSTIN (GST Identification Number) utility functions
 * Provides validation for Indian GSTIN format including checksum validation
 */

/**
 * Convert character to its numeric value for checksum calculation
 * 0-9: 0-9, A-Z: 10-35
 */
function charToValue(char: string): number {
  if (char >= "0" && char <= "9") {
    return parseInt(char, 10);
  }
  if (char >= "A" && char <= "Z") {
    return char.charCodeAt(0) - 55; // A=10, B=11, ..., Z=35
  }
  return 0;
}

/**
 * Calculate GSTIN checksum using mod 36 algorithm
 * Algorithm: Process first 14 characters with factors [1,2,1,2,...]
 * Sum the weighted values, then calculate check digit as (36 - (sum % 36)) % 36
 * @param gstin - GSTIN string (first 14 characters)
 * @returns Calculated check digit (0-9 or A-Z)
 */
function calculateGstinChecksum(gstin: string): string {
  const factor = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  const codePointChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let sum = 0;

  // Process all 14 characters (positions 0-13)
  for (let i = 0; i < 14; i++) {
    const char = gstin[i];
    const value = charToValue(char);
    const product = value * factor[i];
    // Sum the quotient and remainder when divided by 36
    sum += Math.floor(product / 36) + (product % 36);
  }

  // Calculate check digit: (36 - (sum % 36)) % 36
  const checkCodePointValue = (36 - (sum % 36)) % 36;
  return codePointChars[checkCodePointValue];
}

/**
 * Validate GSTIN format and structure
 * GSTIN is 15 characters: 2 digits (state code) + 10 characters (PAN) + 1 digit (entity number) + 1 letter (Z by default) + 1 digit/letter (check digit)
 * @param gstin - GSTIN to validate
 * @returns true if format is valid, false otherwise
 */
export function isValidGstinFormat(gstin: string): boolean {
  if (!gstin || typeof gstin !== "string") {
    return false;
  }

  // Remove spaces and convert to uppercase
  const cleaned = formatGstin(gstin);

  // GSTIN must be exactly 15 characters
  if (cleaned.length !== 15) {
    return false;
  }

  // Pattern: 2 digits (state code) + 10 alphanumeric (PAN) + 1 digit (entity number) + 1 letter (usually Z) + 1 alphanumeric (check digit)
  const gstinPattern = /^[0-9]{2}[A-Z0-9]{10}[0-9]{1}[A-Z]{1}[0-9A-Z]{1}$/;

  if (!gstinPattern.test(cleaned)) {
    return false;
  }

  // Basic structure validation
  // First 2 characters: State code (01-38)
  const stateCode = parseInt(cleaned.substring(0, 2), 10);
  if (stateCode < 1 || stateCode > 38) {
    return false;
  }

  // Characters 3-12: PAN (should be alphanumeric)
  const pan = cleaned.substring(2, 12);
  if (!/^[A-Z0-9]{10}$/.test(pan)) {
    return false;
  }

  // Character 13: Entity number (0-9)
  const entityNumber = cleaned.substring(12, 13);
  if (!/^[0-9]$/.test(entityNumber)) {
    return false;
  }

  // Character 14: Usually 'Z' but can be other letters
  const letter = cleaned.substring(13, 14);
  if (!/^[A-Z]$/.test(letter)) {
    return false;
  }

  return true;
}

/**
 * Validate GSTIN checksum
 * Validates the check digit using mod 36 algorithm
 * @param gstin - GSTIN to validate
 * @returns true if checksum is valid, false otherwise
 */
export function validateGstinChecksum(gstin: string): boolean {
  if (!isValidGstinFormat(gstin)) {
    return false;
  }

  const cleaned = formatGstin(gstin);
  const first14Chars = cleaned.substring(0, 14);
  const providedCheckDigit = cleaned.substring(14, 15);

  const calculatedCheckDigit = calculateGstinChecksum(first14Chars);

  return providedCheckDigit === calculatedCheckDigit;
}

/**
 * Validate GSTIN format and checksum
 * Complete validation including format, structure, and checksum
 * @param gstin - GSTIN to validate
 * @returns true if GSTIN is valid, false otherwise
 */
export function validateGstin(gstin: string): boolean {
  return validateGstinChecksum(gstin);
}

/**
 * Format GSTIN for display (uppercase, no spaces)
 * @param gstin - GSTIN to format
 * @returns Formatted GSTIN
 */
export function formatGstin(gstin: string): string {
  if (!gstin) {
    return "";
  }
  return gstin.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Extract state code from GSTIN
 * @param gstin - GSTIN
 * @returns State code (01-38) or null if invalid
 */
export function extractStateCodeFromGstin(gstin: string): number | null {
  if (!isValidGstinFormat(gstin)) {
    return null;
  }
  const cleaned = formatGstin(gstin);
  const stateCode = parseInt(cleaned.substring(0, 2), 10);
  return stateCode >= 1 && stateCode <= 38 ? stateCode : null;
}
