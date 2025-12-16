import {
  extractCountryCode,
  formatIndianPhone,
  getPhoneWithCountryCode,
  isValidIndianPhoneFormat,
  normalizeIndianPhone,
  validateAndNormalizePhone,
} from "./phone.utils";

describe("Phone Utils", () => {
  describe("isValidIndianPhoneFormat", () => {
    it("should validate correct 10-digit phone numbers", () => {
      expect(isValidIndianPhoneFormat("9876543210")).toBe(true);
      expect(isValidIndianPhoneFormat("8765432109")).toBe(true);
      expect(isValidIndianPhoneFormat("7654321098")).toBe(true);
      expect(isValidIndianPhoneFormat("6543210987")).toBe(true);
    });

    it("should reject phone numbers not starting with 6-9", () => {
      expect(isValidIndianPhoneFormat("5123456789")).toBe(false); // Starts with 5
      expect(isValidIndianPhoneFormat("0123456789")).toBe(false); // Starts with 0
      expect(isValidIndianPhoneFormat("1234567890")).toBe(false); // Starts with 1
    });

    it("should reject phone numbers with invalid length", () => {
      expect(isValidIndianPhoneFormat("987654321")).toBe(false); // 9 digits
      expect(isValidIndianPhoneFormat("98765432101")).toBe(false); // 11 digits
      expect(isValidIndianPhoneFormat("")).toBe(false);
    });

    it("should handle null and undefined", () => {
      expect(isValidIndianPhoneFormat(null as unknown as string)).toBe(false);
      expect(
        isValidIndianPhoneFormat(undefined as unknown as string),
      ).toBe(false);
    });
  });

  describe("normalizeIndianPhone", () => {
    it("should normalize phone numbers correctly", () => {
      expect(normalizeIndianPhone("9876543210")).toBe("9876543210");
      expect(normalizeIndianPhone("+91-9876543210")).toBe("9876543210");
      expect(normalizeIndianPhone("91-9876543210")).toBe("9876543210");
      expect(normalizeIndianPhone("09876543210")).toBe("9876543210"); // Remove leading 0
      expect(normalizeIndianPhone("98765 43210")).toBe("9876543210");
      expect(normalizeIndianPhone("98765-43210")).toBe("9876543210");
    });

    it("should return empty string for invalid phone numbers", () => {
      expect(normalizeIndianPhone("5123456789")).toBe("");
      expect(normalizeIndianPhone("987654321")).toBe("");
      expect(normalizeIndianPhone("")).toBe("");
    });
  });

  describe("formatIndianPhone", () => {
    it("should format phone in international format", () => {
      expect(formatIndianPhone("9876543210", "international")).toBe(
        "+91-98765-43210",
      );
    });

    it("should format phone in national format", () => {
      expect(formatIndianPhone("9876543210", "national")).toBe("98765 43210");
    });

    it("should handle already formatted numbers", () => {
      expect(formatIndianPhone("+91-98765-43210", "international")).toBe(
        "+91-98765-43210",
      );
    });
  });

  describe("getPhoneWithCountryCode", () => {
    it("should add country code to phone number", () => {
      expect(getPhoneWithCountryCode("9876543210")).toBe("+919876543210");
    });

    it("should handle already formatted numbers", () => {
      expect(getPhoneWithCountryCode("+91-98765-43210")).toBe(
        "+919876543210",
      );
    });
  });

  describe("extractCountryCode", () => {
    it("should extract country code from phone number", () => {
      expect(extractCountryCode("+919876543210")).toBe("+91");
      expect(extractCountryCode("919876543210")).toBe("+91");
    });

    it("should return null if no country code", () => {
      expect(extractCountryCode("9876543210")).toBeNull();
    });

    it("should return null for invalid input", () => {
      expect(extractCountryCode("")).toBeNull();
      expect(extractCountryCode(null as unknown as string)).toBeNull();
    });
  });

  describe("validateAndNormalizePhone", () => {
    it("should validate and normalize valid phone number", () => {
      const result = validateAndNormalizePhone("9876543210");
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe("9876543210");
      expect(result.formatted).toBe("+91-98765-43210");
      expect(result.withCountryCode).toBe("+919876543210");
    });

    it("should reject invalid phone number", () => {
      const result = validateAndNormalizePhone("5123456789");
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should normalize phone with country code", () => {
      const result = validateAndNormalizePhone("+91-98765-43210");
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe("9876543210");
    });
  });
});

