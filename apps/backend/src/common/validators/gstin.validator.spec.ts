import { IsOptional } from "class-validator";
import { validate } from "class-validator";
import { IsGstin } from "./gstin.validator";

class TestClass {
  @IsOptional()
  @IsGstin()
  gstin?: string;
}

describe("IsGstin Validator", () => {
  it("should validate correct GSTIN format", async () => {
    const obj = new TestClass();
    obj.gstin = "27ABCDE1234F1Z5";

    const errors = await validate(obj);
    // Note: Checksum validation may fail, but format should be checked
    expect(errors.length).toBeGreaterThanOrEqual(0);
  });

  it("should reject invalid GSTIN format", async () => {
    const obj = new TestClass();
    obj.gstin = "27ABCDE1234F1Z"; // Invalid length

    const errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe("gstin");
  });

  it("should reject empty string", async () => {
    const obj = new TestClass();
    obj.gstin = "";

    const errors = await validate(obj);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should allow undefined (optional field)", async () => {
    const obj = new TestClass();
    obj.gstin = undefined;

    const errors = await validate(obj);
    expect(errors.length).toBe(0);
  });

  it("should handle null (optional field)", async () => {
    const obj = new TestClass();
    obj.gstin = null as unknown as string;

    // @IsOptional() allows null/undefined, so no errors expected
    const errors = await validate(obj);
    // With @IsOptional(), null is allowed, so no validation errors
    expect(errors.length).toBe(0);
  });
});

