/**
 * Test helper utilities
 */

/**
 * Generates a random email for testing
 */
export function randomEmail(domain = "test.com"): string {
  return `test-${Math.random().toString(36).substring(7)}@${domain}`;
}

/**
 * Generates a random phone number for testing (Indian format)
 */
export function randomPhone(): string {
  // Indian phone numbers: 10 digits starting with 6-9
  const firstDigit = Math.floor(Math.random() * 4) + 6; // 6-9
  const rest = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, "0");
  return `${firstDigit}${rest}`;
}

/**
 * Generates a random PIN code for testing (Indian format)
 */
export function randomPinCode(): string {
  // Indian PIN codes: 6 digits
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Waits for a specified amount of time
 * Useful for testing time-based operations
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

