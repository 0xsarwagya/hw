/**
 * Indian Phone Number utility functions
 * Indian mobile numbers are 10 digits, starting with 6-9
 * Country code is +91
 */

/**
 * Clean phone number (remove formatting, country code, leading zeros)
 * Internal helper function - does not validate format
 */
function cleanPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== "string") {
    return "";
  }

  // Remove all spaces, dashes, parentheses, and dots
  let cleaned = phone.trim().replace(/[\s\-().]/g, "");

  // Remove country code (+91 or 91) if present
  if (cleaned.startsWith("+91")) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith("91") && cleaned.length >= 12) {
    cleaned = cleaned.substring(2);
  }

  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, "");

  return cleaned;
}

/**
 * Validate Indian phone number format
 * Must be 10 digits, starting with 6, 7, 8, or 9
 * @param phone - Phone number to validate
 * @returns true if format is valid, false otherwise
 */
export function isValidIndianPhoneFormat(phone: string): boolean {
  if (!phone || typeof phone !== "string") {
    return false;
  }

  // Clean the phone number first
  const cleaned = cleanPhoneNumber(phone);

  // Must be exactly 10 digits starting with 6-9
  const phonePattern = /^[6-9][0-9]{9}$/;

  return phonePattern.test(cleaned);
}

/**
 * Normalize Indian phone number
 * Removes spaces, dashes, country code (+91), and leading zeros
 * @param phone - Phone number to normalize
 * @returns Normalized 10-digit phone number or empty string if invalid
 */
export function normalizeIndianPhone(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);

  // Validate format before returning
  if (isValidIndianPhoneFormat(cleaned)) {
    return cleaned;
  }

  return "";
}

/**
 * Format Indian phone number for display
 * Formats as: +91-XXXXX-XXXXX or +91 XXXXX XXXXX
 * @param phone - Phone number to format
 * @param format - Format style: 'international' (default) or 'national'
 * @returns Formatted phone number
 */
export function formatIndianPhone(
  phone: string,
  format: "international" | "national" = "international",
): string {
  const normalized = normalizeIndianPhone(phone);

  if (!normalized) {
    return phone; // Return original if normalization fails
  }

  if (format === "international") {
    // Format: +91-XXXXX-XXXXX
    return `+91-${normalized.substring(0, 5)}-${normalized.substring(5)}`;
  } else {
    // Format: XXXXX XXXXX (national format)
    return `${normalized.substring(0, 5)} ${normalized.substring(5)}`;
  }
}

/**
 * Get phone number with country code
 * @param phone - Phone number
 * @returns Phone number with +91 prefix
 */
export function getPhoneWithCountryCode(phone: string): string {
  const normalized = normalizeIndianPhone(phone);

  if (!normalized) {
    return phone; // Return original if normalization fails
  }

  return `+91${normalized}`;
}

/**
 * Extract country code from phone number
 * @param phone - Phone number
 * @returns Country code (+91) or null
 */
export function extractCountryCode(phone: string): string | null {
  if (!phone || typeof phone !== "string") {
    return null;
  }

  const cleaned = phone.trim();

  if (cleaned.startsWith("+91")) {
    return "+91";
  }

  if (cleaned.startsWith("91") && cleaned.length >= 12) {
    return "+91";
  }

  return null;
}

/**
 * Validate and normalize phone number
 * @param phone - Phone number to validate and normalize
 * @returns Validation result with normalized phone
 */
export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  formatted: string;
  withCountryCode: string;
  error?: string;
}

export function validateAndNormalizePhone(
  phone: string,
): PhoneValidationResult {
  const normalized = normalizeIndianPhone(phone);

  if (!normalized) {
    return {
      isValid: false,
      normalized: "",
      formatted: phone,
      withCountryCode: phone,
      error:
        "Invalid Indian phone number format. Must be 10 digits starting with 6-9",
    };
  }

  return {
    isValid: true,
    normalized,
    formatted: formatIndianPhone(normalized),
    withCountryCode: getPhoneWithCountryCode(normalized),
  };
}
