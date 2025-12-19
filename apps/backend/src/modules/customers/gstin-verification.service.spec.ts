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
    it("should return isValid false when GSTIN format is invalid", async () => {
      // Arrange
      const invalidGstin = "27ABCDE1234F1Z"; // Invalid length

      // Act
      const result = await service.verifyGstin(invalidGstin);

      // Assert
      expect(result.isValid).toBe(false);
    });

    it("should return error message when GSTIN format is invalid", async () => {
      // Arrange
      const invalidGstin = "27ABCDE1234F1Z"; // Invalid length

      // Act
      const result = await service.verifyGstin(invalidGstin);

      // Assert
      expect(result.error).toBeDefined();
    });

    it("should return isValid false when GSTIN is empty", async () => {
      // Arrange
      const emptyGstin = "";

      // Act
      const result = await service.verifyGstin(emptyGstin);

      // Assert
      expect(result.isValid).toBe(false);
    });

    it("should return error message when GSTIN is empty", async () => {
      // Arrange
      const emptyGstin = "";

      // Act
      const result = await service.verifyGstin(emptyGstin);

      // Assert
      expect(result.error).toBeDefined();
    });

    it("should return boolean isValid property for valid format GSTIN", async () => {
      // Arrange
      const validFormatGstin = "27ABCDE1234F1Z5";

      // Act
      const result = await service.verifyGstin(validFormatGstin);

      // Assert
      expect(typeof result.isValid).toBe("boolean");
    });

    it("should return null for API fields when API integration is not implemented", async () => {
      // Arrange
      const validFormatGstin = "27ABCDE1234F1Z5";

      // Act
      const result = await service.verifyGstin(validFormatGstin);

      // Assert - API integration not implemented, so these fields are null
      expect(result.isActive).toBeNull();
      expect(result.legalName).toBeNull();
    });
  });

  describe("verifyGstinsBatch", () => {
    it("should return results map with correct size for multiple GSTINs", async () => {
      // Arrange
      const gstins = ["27ABCDE1234F1Z5", "09ABCDE1234F1Z5"];

      // Act
      const results = await service.verifyGstinsBatch(gstins);

      // Assert
      expect(results.size).toBe(2);
    });

    it("should include all input GSTINs in results map", async () => {
      // Arrange
      const gstins = ["27ABCDE1234F1Z5", "09ABCDE1234F1Z5"];

      // Act
      const results = await service.verifyGstinsBatch(gstins);

      // Assert
      expect(results.has("27ABCDE1234F1Z5")).toBe(true);
      expect(results.has("09ABCDE1234F1Z5")).toBe(true);
    });

    it("should return empty map when input array is empty", async () => {
      // Arrange
      const emptyGstins: string[] = [];

      // Act
      const results = await service.verifyGstinsBatch(emptyGstins);

      // Assert
      expect(results.size).toBe(0);
    });

    it("should return results for all GSTINs including invalid ones", async () => {
      // Arrange
      const gstins = ["27ABCDE1234F1Z5", "INVALID"];

      // Act
      const results = await service.verifyGstinsBatch(gstins);

      // Assert
      expect(results.size).toBe(2);
    });

    it("should return boolean isValid for valid format GSTINs", async () => {
      // Arrange
      const gstins = ["27ABCDE1234F1Z5", "INVALID"];

      // Act
      const results = await service.verifyGstinsBatch(gstins);

      // Assert - Format is valid, but checksum validation determines final result
      const result1 = results.get("27ABCDE1234F1Z5");
      expect(result1).toBeDefined();
      expect(typeof result1?.isValid).toBe("boolean");
    });

    it("should return isValid false for invalid format GSTINs", async () => {
      // Arrange
      const gstins = ["27ABCDE1234F1Z5", "INVALID"];

      // Act
      const results = await service.verifyGstinsBatch(gstins);

      // Assert
      expect(results.get("INVALID")?.isValid).toBe(false);
    });
  });
});

