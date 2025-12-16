import {
  formatIndianAddress,
  isAddressComplete,
  validateIndianAddress,
} from "./address.utils";

describe("Address Utils", () => {
  describe("validateIndianAddress", () => {
    it("should validate complete valid address", () => {
      const result = validateIndianAddress({
        street: "123 Main Street, Apartment 4B",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        district: "Mumbai",
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject address with missing street", () => {
      const result = validateIndianAddress({
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Street address is required");
    });

    it("should reject address with missing city", () => {
      const result = validateIndianAddress({
        street: "123 Main Street",
        state: "Maharashtra",
        pincode: "400001",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("City is required");
    });

    it("should reject address with missing state", () => {
      const result = validateIndianAddress({
        street: "123 Main Street",
        city: "Mumbai",
        pincode: "400001",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("State is required");
    });

    it("should reject address with invalid state", () => {
      const result = validateIndianAddress({
        street: "123 Main Street",
        city: "Mumbai",
        state: "Invalid State",
        pincode: "400001",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("Invalid state"))).toBe(true);
    });

    it("should reject address with invalid PIN code", () => {
      const result = validateIndianAddress({
        street: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "40001",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("PIN code"))).toBe(true);
    });

    it("should reject address with invalid phone", () => {
      const result = validateIndianAddress({
        street: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        phone: "1234567890",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("phone"))).toBe(true);
    });

    it("should accept valid phone number", () => {
      const result = validateIndianAddress({
        street: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        phone: "9876543210",
      });

      expect(result.isValid).toBe(true);
    });

    it("should warn about short street address", () => {
      const result = validateIndianAddress({
        street: "123",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      });

      expect(result.warnings.some((w) => w.includes("short"))).toBe(true);
    });

    it("should validate state case-insensitively", () => {
      const result = validateIndianAddress({
        street: "123 Main Street",
        city: "Mumbai",
        state: "maharashTra",
        pincode: "400001",
      });

      expect(result.isValid).toBe(true);
    });
  });

  describe("formatIndianAddress", () => {
    it("should format complete address", () => {
      const formatted = formatIndianAddress({
        street: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        district: "Mumbai",
      });

      expect(formatted).toContain("123 Main Street");
      expect(formatted).toContain("Mumbai");
      expect(formatted).toContain("Maharashtra");
      expect(formatted).toContain("400001");
    });

    it("should format address without district", () => {
      const formatted = formatIndianAddress({
        street: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      });

      expect(formatted).toBeTruthy();
    });
  });

  describe("isAddressComplete", () => {
    it("should return true for complete address", () => {
      const complete = isAddressComplete({
        street: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      });

      expect(complete).toBe(true);
    });

    it("should return false for incomplete address", () => {
      const complete = isAddressComplete({
        street: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        // Missing pincode
      });

      expect(complete).toBe(false);
    });

    it("should return false for empty address", () => {
      const complete = isAddressComplete({});

      expect(complete).toBe(false);
    });
  });
});

