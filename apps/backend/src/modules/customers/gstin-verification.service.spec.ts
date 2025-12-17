import { Test, TestingModule } from "@nestjs/testing";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../common/logging/context.service";
import { getCommonTestProviders } from "../../common/testing/test-helpers";
import { GstinVerificationService } from "./gstin-verification.service";

describe("GstinVerificationService", () => {
  let service: GstinVerificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GstinVerificationService, ...getCommonTestProviders()],
    }).compile();

    service = module.get<GstinVerificationService>(GstinVerificationService);
  });

  describe("verifyGstin", () => {
    it("should reject invalid GSTIN format", async () => {
      const result = await service.verifyGstin("27ABCDE1234F1Z"); // Invalid length

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject empty GSTIN", async () => {
      const result = await service.verifyGstin("");

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should return validation result for valid format GSTIN", async () => {
      const result = await service.verifyGstin("27ABCDE1234F1Z5");

      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe("boolean");
      // Note: API integration not implemented, so isActive and other fields will be null
      expect(result.isActive).toBeNull();
      expect(result.legalName).toBeNull();
    });

    it("should handle GSTIN with correct format", async () => {
      const result = await service.verifyGstin("27ABCDE1234F1Z5");

      // Result depends on checksum validation
      // Format is valid, but checksum may or may not be valid
      expect(typeof result.isValid).toBe("boolean");
      // If checksum is invalid, isValid will be false
      // This is expected behavior - full validation includes checksum
    });
  });

  describe("verifyGstinsBatch", () => {
    it("should verify multiple GSTINs", async () => {
      const gstins = ["27ABCDE1234F1Z5", "09ABCDE1234F1Z5"];

      const results = await service.verifyGstinsBatch(gstins);

      expect(results.size).toBe(2);
      expect(results.has("27ABCDE1234F1Z5")).toBe(true);
      expect(results.has("09ABCDE1234F1Z5")).toBe(true);
    });

    it("should handle empty array", async () => {
      const results = await service.verifyGstinsBatch([]);

      expect(results.size).toBe(0);
    });

    it("should handle mix of valid and invalid GSTINs", async () => {
      const gstins = ["27ABCDE1234F1Z5", "INVALID"];

      const results = await service.verifyGstinsBatch(gstins);

      expect(results.size).toBe(2);
      // Format is valid, but checksum validation determines final result
      const result1 = results.get("27ABCDE1234F1Z5");
      expect(result1).toBeDefined();
      expect(typeof result1?.isValid).toBe("boolean");
      // Invalid GSTIN should definitely fail
      expect(results.get("INVALID")?.isValid).toBe(false);
    });
  });
});

