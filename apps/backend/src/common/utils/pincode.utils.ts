/**
 * PIN Code (Postal Index Number) utility functions for Indian addresses
 * PIN codes are 6-digit numbers used by India Post
 */

import {
  DEFAULT_FALLBACK_SHIPPING_RATE_INR,
  DEFAULT_WEIGHT_INCREMENT_GRAMS,
} from "../constants";

/**
 * Validate PIN code format
 * PIN code must be exactly 6 digits
 * @param pincode - PIN code to validate
 * @returns true if format is valid, false otherwise
 */
export function isValidPincodeFormat(pincode: string): boolean {
  if (!pincode || typeof pincode !== "string") {
    return false;
  }

  // Remove spaces and check if it's exactly 6 digits
  const cleaned = pincode.trim().replace(/\s+/g, "");

  // Must be exactly 6 digits
  const pincodePattern = /^[0-9]{6}$/;

  return pincodePattern.test(cleaned);
}

/**
 * Format PIN code (remove spaces, ensure 6 digits)
 * @param pincode - PIN code to format
 * @returns Formatted PIN code or empty string if invalid
 */
export function formatPincode(pincode: string): string {
  if (!pincode || typeof pincode !== "string") {
    return "";
  }

  const cleaned = pincode.trim().replace(/\s+/g, "");

  // Return formatted if valid, otherwise return empty string
  if (isValidPincodeFormat(cleaned)) {
    return cleaned;
  }

  return "";
}

/**
 * Extract first digit of PIN code (region indicator)
 * First digit indicates the region:
 * 1-2: Northern region
 * 3-4: Western region
 * 5-6: Southern region
 * 7-8: Eastern region
 * 9: Army Post Office (APO) and Field Post Office (FPO)
 * @param pincode - PIN code
 * @returns First digit (1-9) or null if invalid
 */
export function getPincodeRegion(pincode: string): number | null {
  if (!isValidPincodeFormat(pincode)) {
    return null;
  }

  const formatted = formatPincode(pincode);
  const firstDigit = parseInt(formatted.charAt(0), 10);

  return firstDigit >= 1 && firstDigit <= 9 ? firstDigit : null;
}

/**
 * Get region name from PIN code first digit
 * @param pincode - PIN code
 * @returns Region name or null if invalid
 */
export function getPincodeRegionName(pincode: string): string | null {
  const firstDigit = getPincodeRegion(pincode);

  if (firstDigit === null) {
    return null;
  }

  const regionMap: Record<number, string> = {
    1: "Northern",
    2: "Northern",
    3: "Western",
    4: "Western",
    5: "Southern",
    6: "Southern",
    7: "Eastern",
    8: "Eastern",
    9: "APO/FPO",
  };

  return regionMap[firstDigit] || null;
}

/**
 * Validate PIN code and check if it's serviceable
 * This is a placeholder - in production, integrate with actual serviceability API
 * @param pincode - PIN code to validate
 * @returns Validation result with serviceability info
 */
export interface PincodeValidationResult {
  isValid: boolean;
  isServiceable: boolean;
  state?: string;
  district?: string;
  city?: string;
  error?: string;
}

export async function validatePincode(
  pincode: string,
): Promise<PincodeValidationResult> {
  // Format validation
  if (!isValidPincodeFormat(pincode)) {
    return {
      isValid: false,
      isServiceable: false,
      error: "Invalid PIN code format. PIN code must be exactly 6 digits",
    };
  }

  // TODO: Integrate with actual PIN code serviceability API
  // Example integration:
  // try {
  //   const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
  //   const data = await response.json();
  //   if (data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
  //     const postOffice = data[0].PostOffice[0];
  //     return {
  //       isValid: true,
  //       isServiceable: true,
  //       state: postOffice.State,
  //       district: postOffice.District,
  //       city: postOffice.Name,
  //     };
  //   }
  // } catch (error) {
  //   return { isValid: true, isServiceable: false, error: "Serviceability check failed" };
  // }

  // Placeholder: Return basic validation result
  // In production, this should check against actual PIN code database/API
  return {
    isValid: true,
    isServiceable: true, // Would be determined by API
  };
}

/**
 * Serviceability result for PIN code
 * Used by shipping service
 */
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
 * Check PIN code serviceability
 * Used as fallback by shipping service when PIN code not in database
 * @param pincode - PIN code to check
 * @returns Serviceability result
 */
export async function checkPincodeServiceability(
  pincode: string,
): Promise<ServiceabilityResult> {
  // Format validation
  if (!isValidPincodeFormat(pincode)) {
    return {
      isValid: false,
      isServiceable: false,
      codAvailable: false,
      shippingZone: "zone_c",
      error: "Invalid PIN code format",
    };
  }

  // TODO: Integrate with actual PIN code serviceability API
  // For now, return basic validation result
  // In production, this should check against actual PIN code database/API
  return {
    isValid: true,
    isServiceable: true, // Would be determined by API
    codAvailable: true, // Would be determined by API
    shippingZone: "zone_c", // Default zone, would be determined by API
  };
}

/**
 * Get shipping rate by zone and weight
 * @param zone - Shipping zone
 * @param weight - Weight in grams
 * @returns Shipping rate or null
 */
export function getShippingRateByZone(
  zone: string,
  weight: number,
): number | null {
  // Basic zone-based rate calculation
  // In production, this would use actual rate tables
  const baseRates: Record<string, number> = {
    metro: 50,
    zone_a: 75,
    zone_b: 100,
    zone_c: 125,
    zone_d: 150,
    zone_e: 200,
  };

  const baseRate = baseRates[zone] || DEFAULT_FALLBACK_SHIPPING_RATE_INR;

  // Add weight-based charges (per configured increment)
  const weightMultiplier = Math.ceil(weight / DEFAULT_WEIGHT_INCREMENT_GRAMS);
  const totalRate = baseRate * weightMultiplier;

  return totalRate;
}

/**
 * Get state and district from PIN code
 * This can be integrated with PIN code lookup API
 * @param pincode - PIN code
 * @returns State and district info or null
 */
export interface PincodeLocationInfo {
  state: string;
  district: string;
  city?: string;
}

export async function getPincodeLocation(
  pincode: string,
): Promise<PincodeLocationInfo | null> {
  const validation = await validatePincode(pincode);

  if (!validation.isValid || !validation.isServiceable) {
    return null;
  }

  if (validation.state && validation.district) {
    return {
      state: validation.state,
      district: validation.district,
      city: validation.city,
    };
  }

  // TODO: Query database or API for PIN code location
  // This would typically query the pincodes table or external API

  return null;
}
