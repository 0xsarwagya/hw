import {
  formatPincode,
  getPincodeRegion,
  getPincodeRegionName,
  isValidPincodeFormat,
  validatePincode,
} from "./pincode.utils";

describe("PIN Code Utils", () => {
  describe("isValidPincodeFormat", () => {
    it("should validate correct 6-digit PIN codes", () => {
      expect(isValidPincodeFormat("400001")).toBe(true);
      expect(isValidPincodeFormat("110001")).toBe(true);
      expect(isValidPincodeFormat("560001")).toBe(true);
    });

    it("should reject PIN codes with invalid length", () => {
      expect(isValidPincodeFormat("40001")).toBe(false); // 5 digits
      expect(isValidPincodeFormat("4000011")).toBe(false); // 7 digits
      expect(isValidPincodeFormat("")).toBe(false);
    });

    it("should reject PIN codes with non-numeric characters", () => {
      expect(isValidPincodeFormat("40000A")).toBe(false);
      expect(isValidPincodeFormat("400-001")).toBe(false);
    });

    it("should accept PIN codes with spaces (normalized)", () => {
      // Spaces are normalized, so this becomes valid
      expect(isValidPincodeFormat("40 0001")).toBe(true);
    });

    it("should handle null and undefined", () => {
      expect(isValidPincodeFormat(null as unknown as string)).toBe(false);
      expect(isValidPincodeFormat(undefined as unknown as string)).toBe(false);
    });
  });

  describe("formatPincode", () => {
    it("should format PIN code correctly", () => {
      expect(formatPincode("400001")).toBe("400001");
      expect(formatPincode("400 001")).toBe("400001");
      expect(formatPincode("  400001  ")).toBe("400001");
    });

    it("should return empty string for invalid PIN codes", () => {
      expect(formatPincode("40001")).toBe("");
      expect(formatPincode("40000A")).toBe("");
      expect(formatPincode("")).toBe("");
    });
  });

  describe("getPincodeRegion", () => {
    it("should extract region digit from valid PIN code", () => {
      expect(getPincodeRegion("400001")).toBe(4); // Western
      expect(getPincodeRegion("110001")).toBe(1); // Northern
      expect(getPincodeRegion("560001")).toBe(5); // Southern
    });

    it("should return null for invalid PIN code", () => {
      expect(getPincodeRegion("40001")).toBeNull();
      expect(getPincodeRegion("")).toBeNull();
    });
  });

  describe("getPincodeRegionName", () => {
    it("should return correct region name", () => {
      expect(getPincodeRegionName("400001")).toBe("Western");
      expect(getPincodeRegionName("110001")).toBe("Northern");
      expect(getPincodeRegionName("560001")).toBe("Southern");
      expect(getPincodeRegionName("700001")).toBe("Eastern");
      expect(getPincodeRegionName("900001")).toBe("APO/FPO");
    });

    it("should return null for invalid PIN code", () => {
      expect(getPincodeRegionName("40001")).toBeNull();
      expect(getPincodeRegionName("")).toBeNull();
    });
  });

  describe("validatePincode", () => {
    it("should validate correct PIN code format", async () => {
      const result = await validatePincode("400001");
      expect(result.isValid).toBe(true);
    });

    it("should reject invalid PIN code format", async () => {
      const result = await validatePincode("40001");
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should return serviceability info", async () => {
      const result = await validatePincode("400001");
      expect(typeof result.isServiceable).toBe("boolean");
    });
  });
});

