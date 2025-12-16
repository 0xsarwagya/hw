/**
 * Indian Address format validation utilities
 */

import { getStateByName } from "../data/indian-states";
import { isValidIndianPhoneFormat } from "./phone.utils";
import { isValidPincodeFormat } from "./pincode.utils";

export interface AddressValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate Indian address format
 * Checks:
 * - Street address is present and not empty
 * - City is present and not empty
 * - State is a valid Indian state/UT
 * - PIN code is valid format
 * - Phone number is valid (if provided)
 * @param address - Address object to validate
 * @returns Validation result
 */
export function validateIndianAddress(address: {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  district?: string;
  phone?: string;
}): AddressValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate street address
  if (!address.street || address.street.trim().length === 0) {
    errors.push("Street address is required");
  } else if (address.street.trim().length < 5) {
    warnings.push("Street address seems too short");
  } else if (address.street.length > 500) {
    errors.push("Street address must not exceed 500 characters");
  }

  // Validate city
  if (!address.city || address.city.trim().length === 0) {
    errors.push("City is required");
  } else if (address.city.trim().length < 2) {
    errors.push("City name must be at least 2 characters");
  } else if (address.city.length > 100) {
    errors.push("City name must not exceed 100 characters");
  }

  // Validate state
  if (!address.state || address.state.trim().length === 0) {
    errors.push("State is required");
  } else {
    const state = getStateByName(address.state.trim());
    if (!state) {
      errors.push(
        `Invalid state: "${address.state}". Must be a valid Indian state or union territory`,
      );
    }
  }

  // Validate district (optional but recommended)
  if (address.district) {
    if (address.district.trim().length < 2) {
      warnings.push("District name seems too short");
    } else if (address.district.length > 100) {
      errors.push("District name must not exceed 100 characters");
    }
  }

  // Validate PIN code
  if (!address.pincode || address.pincode.trim().length === 0) {
    errors.push("PIN code is required");
  } else if (!isValidPincodeFormat(address.pincode)) {
    errors.push("Invalid PIN code format. PIN code must be exactly 6 digits");
  }

  // Validate phone number (optional)
  if (address.phone) {
    if (!isValidIndianPhoneFormat(address.phone)) {
      errors.push(
        "Invalid phone number format. Must be 10 digits starting with 6-9",
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format address for display
 * @param address - Address object
 * @returns Formatted address string
 */
export function formatIndianAddress(address: {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  district?: string;
}): string {
  const parts: string[] = [];

  if (address.street) {
    parts.push(address.street.trim());
  }

  if (address.district) {
    parts.push(address.district.trim());
  }

  if (address.city) {
    parts.push(address.city.trim());
  }

  if (address.state) {
    parts.push(address.state.trim());
  }

  if (address.pincode) {
    parts.push(address.pincode.trim());
  }

  return parts.join(", ");
}

/**
 * Validate address completeness
 * Checks if all required fields are present
 * @param address - Address object
 * @returns true if complete, false otherwise
 */
export function isAddressComplete(address: {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
}): boolean {
  return !!(
    address.street?.trim() &&
    address.city?.trim() &&
    address.state?.trim() &&
    address.pincode?.trim()
  );
}
