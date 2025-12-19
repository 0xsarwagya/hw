import { describe, expect, it } from "vitest";
import {
  isValidPincodeFormat,
  formatPincode,
  extractRegionCodeFromPincode,
  getStateFromRegionCode,
  checkPincodeServiceability,
  getShippingZoneFromRegion,
  getShippingRateByZone,
} from "./pincode.utils";

describe("PIN Code Utils", () => {
  describe("isValidPincodeFormat", () => {
    it("should return true for valid 6-digit PIN code 110001", () => {
      // Arrange
      const pincode = "110001";

      // Act
      const result = isValidPincodeFormat(pincode);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for valid 6-digit PIN code 400001", () => {
      // Arrange
      const pincode = "400001";

      // Act
      const result = isValidPincodeFormat(pincode);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for valid 6-digit PIN code 560001", () => {
      // Arrange
      const pincode = "560001";

      // Act
      const result = isValidPincodeFormat(pincode);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for PIN code with 5 digits", () => {
      // Arrange
      const pincode = "11001";

      // Act
      const result = isValidPincodeFormat(pincode);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for PIN code with 4 digits", () => {
      // Arrange
      const pincode = "1100";

      // Act
      const result = isValidPincodeFormat(pincode);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for PIN code with 1 digit", () => {
      // Arrange
      const pincode = "1";

      // Act
      const result = isValidPincodeFormat(pincode);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for PIN code with 7 digits", () => {
      // Arrange
      const pincode = "1100011";

      // Act
      const result = isValidPincodeFormat(pincode);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for PIN code with 8 digits", () => {
      // Arrange
      const pincode = "11000123";

      // Act
      const result = isValidPincodeFormat(pincode);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for PIN code with letter at end", () => {
      // Arrange
      const pincode = "11000a";

      // Act
      const result = isValidPincodeFormat(pincode);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for PIN code with letter in middle", () => {
      // Arrange
      const pincode = "11a001";

      // Act
      const result = isValidPincodeFormat(pincode);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for PIN code with all letters", () => {
      // Arrange
      const pincode = "abc123";

      // Act
      const result = isValidPincodeFormat(pincode);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for empty string", () => {
      // Arrange
      const pincode = "";

      // Act
      const result = isValidPincodeFormat(pincode);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for null value", () => {
      // Arrange
      const pincode = null as unknown as string;

      // Act
      const result = isValidPincodeFormat(pincode);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for undefined value", () => {
      // Arrange
      const pincode = undefined as unknown as string;

      // Act
      const result = isValidPincodeFormat(pincode);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for PIN code with space in middle", () => {
      // Arrange
      const pincode = "110 001";

      // Act
      const result = isValidPincodeFormat(pincode);

      // Assert
      expect(result).toBe(false);
    });

    it("should return true for PIN code with leading and trailing spaces", () => {
      // Arrange
      const pincode = " 110001 ";

      // Act
      const result = isValidPincodeFormat(pincode);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe("formatPincode", () => {
    it("should trim whitespace from PIN codes", () => {
      expect(formatPincode(" 110001 ")).toBe("110001");
      expect(formatPincode("110 001")).toBe("110 001");
    });

    it("should return empty string for empty input", () => {
      expect(formatPincode("")).toBe("");
      expect(formatPincode(null as unknown as string)).toBe("");
      expect(formatPincode(undefined as unknown as string)).toBe("");
    });

    it("should preserve non-space characters", () => {
      expect(formatPincode("110001")).toBe("110001");
      expect(formatPincode("11a001")).toBe("11a001");
    });
  });

  describe("extractRegionCodeFromPincode", () => {
    it("should return correct region code for valid PIN codes", () => {
      expect(extractRegionCodeFromPincode("110001")).toBe(1); // Delhi
      expect(extractRegionCodeFromPincode("200001")).toBe(2); // Haryana
      expect(extractRegionCodeFromPincode("400001")).toBe(4); // Maharashtra
      expect(extractRegionCodeFromPincode("560001")).toBe(5); // Karnataka
      expect(extractRegionCodeFromPincode("700001")).toBe(7); // West Bengal
      expect(extractRegionCodeFromPincode("800001")).toBe(8); // Bihar
      expect(extractRegionCodeFromPincode("900001")).toBe(9); // UP
    });

    it("should return null for invalid PIN codes", () => {
      expect(extractRegionCodeFromPincode("000000")).toBe(null);
      expect(extractRegionCodeFromPincode("1000000")).toBe(null);
      expect(extractRegionCodeFromPincode("abc123")).toBe(null);
      expect(extractRegionCodeFromPincode("")).toBe(null);
    });

    it("should return null for region code 0", () => {
      expect(extractRegionCodeFromPincode("000001")).toBe(null);
    });
  });

  describe("getStateFromRegionCode", () => {
    it("should return correct state for valid region codes", () => {
      expect(getStateFromRegionCode(1)).toBe("Delhi");
      expect(getStateFromRegionCode(4)).toBe("Maharashtra, Goa");
      expect(getStateFromRegionCode(5)).toBe("Tamil Nadu, Kerala, Lakshadweep, Puducherry");
      expect(getStateFromRegionCode(6)).toBe("Karnataka");
    });

    it("should return null for invalid region codes", () => {
      expect(getStateFromRegionCode(0)).toBe(null);
      expect(getStateFromRegionCode(10)).toBe(null);
      expect(getStateFromRegionCode(-1)).toBe(null);
    });
  });

  describe("getShippingZoneFromRegion", () => {
    it("should return correct shipping zone for region codes", () => {
      expect(getShippingZoneFromRegion(1)).toBe("metro"); // Delhi
      expect(getShippingZoneFromRegion(2)).toBe("zone_a"); // North India
      expect(getShippingZoneFromRegion(4)).toBe("zone_a"); // Maharashtra
      expect(getShippingZoneFromRegion(5)).toBe("zone_b"); // South India
      expect(getShippingZoneFromRegion(6)).toBe("zone_b"); // Karnataka
      expect(getShippingZoneFromRegion(8)).toBe("zone_c"); // Bihar
      expect(getShippingZoneFromRegion(9)).toBe("zone_c"); // UP
    });

    it("should return zone_c for unknown region codes", () => {
      expect(getShippingZoneFromRegion(0)).toBe("zone_c");
      expect(getShippingZoneFromRegion(10)).toBe("zone_c");
    });
  });

  describe("getShippingRateByZone", () => {
    it("should return correct base rates for different zones", () => {
      expect(getShippingRateByZone("metro", 500)).toBe(50);
      expect(getShippingRateByZone("zone_a", 500)).toBe(80);
      expect(getShippingRateByZone("zone_b", 500)).toBe(100);
      expect(getShippingRateByZone("zone_c", 500)).toBe(120);
    });

    it("should add surcharge for weight over 500g", () => {
      expect(getShippingRateByZone("metro", 1000)).toBe(70); // 50 + 20
      expect(getShippingRateByZone("zone_a", 1500)).toBe(100); // 80 + 20
    });

    it("should return null for unknown zones", () => {
      expect(getShippingRateByZone("unknown", 500)).toBe(null);
      expect(getShippingRateByZone("", 500)).toBe(null);
    });
  });

  describe("checkPincodeServiceability", () => {
    it("should return invalid result for malformed PIN codes", async () => {
      const result = await checkPincodeServiceability("12345");
      expect(result.isValid).toBe(false);
      expect(result.isServiceable).toBe(false);
      expect(result.codAvailable).toBe(false);
      expect(result.error).toBe("Invalid PIN code format");
    });

    it("should return invalid result for invalid region codes", async () => {
      const result = await checkPincodeServiceability("000001");
      expect(result.isValid).toBe(false);
      expect(result.isServiceable).toBe(false);
      expect(result.codAvailable).toBe(false);
      expect(result.error).toBe("Invalid region code");
    });

    it("should return serviceable result for valid PIN codes", async () => {
      const result = await checkPincodeServiceability("110001");
      expect(result.isValid).toBe(true);
      expect(result.isServiceable).toBe(true);
      expect(result.shippingZone).toBe("metro");
      expect(result.state).toBe("Delhi");
    });

    it("should mark non-serviceable PIN codes correctly", async () => {
      const result = await checkPincodeServiceability("000000");
      expect(result.isValid).toBe(true);
      expect(result.isServiceable).toBe(false);
      expect(result.codAvailable).toBe(false);
    });

    it("should determine COD availability based on zone", async () => {
      const metroResult = await checkPincodeServiceability("110001"); // metro
      expect(metroResult.codAvailable).toBe(true);

      const zoneCResult = await checkPincodeServiceability("800001"); // zone_c
      expect(zoneCResult.codAvailable).toBe(false);
    });
  });
});
