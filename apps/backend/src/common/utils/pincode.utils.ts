/**
 * PIN code (Postal Index Number) utility functions for India
 * Provides validation, serviceability checks, and utilities for Indian PIN codes
 */

export interface PincodeData {
  pincode: string;
  state: string;
  stateCode: string;
  district: string;
  city: string;
  isServiceable: boolean;
  codAvailable: boolean;
  shippingZone: string;
}

export interface ServiceabilityResult {
  isValid: boolean;
  isServiceable: boolean;
  codAvailable: boolean;
  shippingZone: string;
  state?: string;
  district?: string;
  city?: string;
  error?: string;
}

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
 * Extract region code from PIN code (first digit)
 * Indian PIN codes are divided into 9 regions (1-9)
 * @param pincode - PIN code
 * @returns Region code (1-9) or null if invalid
 */
export function extractRegionCodeFromPincode(pincode: string): number | null {
  if (!isValidPincodeFormat(pincode)) {
    return null;
  }
  const cleaned = formatPincode(pincode);
  const firstDigit = parseInt(cleaned.substring(0, 1), 10);
  return firstDigit >= 1 && firstDigit <= 9 ? firstDigit : null;
}

/**
 * Get state name from region code
 * Simplified mapping of Indian PIN code regions to states
 * Note: This is a basic mapping. Real implementation needs comprehensive database.
 * @param regionCode - Region code (1-9)
 * @returns State name or null
 */
export function getStateFromRegionCode(regionCode: number): string | null {
  const stateMapping: Record<number, string> = {
    1: "Delhi",
    2: "Haryana, Punjab, Himachal Pradesh, Jammu & Kashmir, Chandigarh",
    3: "Rajasthan, Gujarat, Daman & Diu, Dadra & Nagar Haveli",
    4: "Maharashtra, Goa",
    5: "Tamil Nadu, Kerala, Lakshadweep, Puducherry",
    6: "Karnataka",
    7: "West Bengal, Andaman & Nicobar Islands",
    8: "Bihar, Jharkhand",
    9: "Uttar Pradesh, Uttarakhand",
  };

  return stateMapping[regionCode] || null;
}

/**
 * Check if PIN code is serviceable
 * This is a placeholder function. Real implementation should check against database/service.
 * @param pincode - PIN code to check
 * @returns Serviceability result
 */
export async function checkPincodeServiceability(pincode: string): Promise<ServiceabilityResult> {
  if (!isValidPincodeFormat(pincode)) {
    return {
      isValid: false,
      isServiceable: false,
      codAvailable: false,
      shippingZone: "",
      error: "Invalid PIN code format",
    };
  }

  const cleaned = formatPincode(pincode);
  const regionCode = extractRegionCodeFromPincode(cleaned);

  if (!regionCode) {
    return {
      isValid: false,
      isServiceable: false,
      codAvailable: false,
      shippingZone: "",
      error: "Invalid region code",
    };
  }

  // Placeholder logic - in real implementation, this would query a database
  // For now, we'll assume most PIN codes are serviceable except some specific ones
  const nonServiceablePincodes = ["000000", "999999"]; // Example non-serviceable codes
  const isServiceable = !nonServiceablePincodes.includes(cleaned);

  // Determine shipping zone based on region
  const shippingZone = getShippingZoneFromRegion(regionCode);

  // COD availability logic (simplified)
  const codAvailable = isServiceable && ["metro", "zone_a"].includes(shippingZone);

  return {
    isValid: true,
    isServiceable,
    codAvailable,
    shippingZone,
    state: getStateFromRegionCode(regionCode) || undefined,
    // district and city would be populated from database in real implementation
  };
}

/**
 * Get shipping zone from region code
 * @param regionCode - Region code (1-9)
 * @returns Shipping zone
 */
export function getShippingZoneFromRegion(regionCode: number): string {
  // Simplified zone mapping
  const zoneMapping: Record<number, string> = {
    1: "metro", // Delhi
    2: "zone_a", // North India
    3: "zone_a", // West India
    4: "zone_a", // Maharashtra, Goa
    5: "zone_b", // South India
    6: "zone_b", // Karnataka
    7: "zone_b", // East India
    8: "zone_c", // Bihar, Jharkhand
    9: "zone_c", // UP, Uttarakhand
  };

  return zoneMapping[regionCode] || "zone_c";
}

/**
 * Get shipping rates based on zone
 * @param zone - Shipping zone
 * @param weight - Weight in grams
 * @returns Shipping rate or null if not available
 */
export function getShippingRateByZone(zone: string, weight: number = 500): number | null {
  const baseRates: Record<string, number> = {
    metro: 50,
    zone_a: 80,
    zone_b: 100,
    zone_c: 120,
  };

  const baseRate = baseRates[zone];
  if (!baseRate) return null;

  // Additional charge for weight over 500g
  const additionalWeight = Math.max(0, weight - 500);
  const additionalRate = Math.ceil(additionalWeight / 500) * 20;

  return baseRate + additionalRate;
}
