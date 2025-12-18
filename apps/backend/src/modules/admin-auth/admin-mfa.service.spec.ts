import { Test, TestingModule } from "@nestjs/testing";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { AdminMfaService } from "./admin-mfa.service";
import { getCommonTestProviders } from "../../common/testing/test-helpers";
import { authenticator } from "otplib";
import * as qrcode from "qrcode";

// Mock database
jest.mock("@vcecom/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  },
  admin2fa: {},
  users: {},
  eq: jest.fn(),
}));

// Mock otplib
jest.mock("otplib", () => ({
  authenticator: {
    generateSecret: jest.fn(),
    keyuri: jest.fn(),
    verify: jest.fn(),
  },
}));

// Mock qrcode
jest.mock("qrcode", () => ({
  toDataURL: jest.fn(),
}));

describe("AdminMfaService", () => {
  let service: AdminMfaService;
  let mockDb: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminMfaService, ...getCommonTestProviders()],
    }).compile();

    service = module.get<AdminMfaService>(AdminMfaService);
    mockDb = require("@vcecom/db").db;
    jest.clearAllMocks();
  });

  describe("generateSecret", () => {
    it("should generate TOTP secret and QR code URL", async () => {
      const adminId = "admin-1";
      const mockAdmin = {
        id: adminId,
        email: "admin@test.com",
      };
      const mockSecret = "JBSWY3DPEHPK3PXP";
      const mockOtpAuthUrl = "otpauth://totp/VCEcom%20Admin:admin@test.com?secret=JBSWY3DPEHPK3PXP";

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockAdmin]),
          }),
        }),
      });

      (authenticator.generateSecret as jest.Mock).mockReturnValue(mockSecret);
      (authenticator.keyuri as jest.Mock).mockReturnValue(mockOtpAuthUrl);

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await service.generateSecret(adminId);

      expect(result.secret).toBe(mockSecret);
      expect(result.otpAuthUrl).toBe(mockOtpAuthUrl);
      expect(authenticator.generateSecret).toHaveBeenCalled();
    });

    it("should throw NotFoundException if admin not found", async () => {
      const adminId = "admin-1";

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.generateSecret(adminId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("generateQRCode", () => {
    it("should generate QR code data URL", async () => {
      const otpAuthUrl = "otpauth://totp/Test:user@test.com?secret=ABC123";
      const mockQRCode = "data:image/png;base64,iVBORw0KGgo...";

      (qrcode.toDataURL as jest.Mock).mockResolvedValue(mockQRCode);

      const result = await service.generateQRCode(otpAuthUrl);

      expect(result).toBe(mockQRCode);
      expect(qrcode.toDataURL).toHaveBeenCalledWith(otpAuthUrl);
    });

    it("should throw BadRequestException if QR code generation fails", async () => {
      const otpAuthUrl = "invalid-url";
      const error = new Error("QR code generation failed");

      (qrcode.toDataURL as jest.Mock).mockRejectedValue(error);

      await expect(service.generateQRCode(otpAuthUrl)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("enable2FA", () => {
    it("should enable 2FA after verifying code", async () => {
      const adminId = "admin-1";
      const secret = "JBSWY3DPEHPK3PXP";
      const code = "123456";

      (authenticator.verify as jest.Mock).mockReturnValue(true);

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await service.enable2FA(adminId, secret, code);

      expect(result).toHaveLength(10);
      expect(result.every((code) => typeof code === "string")).toBe(true);
      expect(authenticator.verify).toHaveBeenCalledWith({
        token: code,
        secret,
      });
    });

    it("should throw BadRequestException for invalid code", async () => {
      const adminId = "admin-1";
      const secret = "JBSWY3DPEHPK3PXP";
      const code = "invalid";

      (authenticator.verify as jest.Mock).mockReturnValue(false);

      await expect(service.enable2FA(adminId, secret, code)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("disable2FA", () => {
    it("should disable 2FA with valid TOTP code", async () => {
      const adminId = "admin-1";
      const code = "123456";
      const mock2fa = {
        adminId,
        secret: "JBSWY3DPEHPK3PXP",
        backupCodes: [],
        enabled: true,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mock2fa]),
          }),
        }),
      });

      (authenticator.verify as jest.Mock).mockReturnValue(true);

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await service.disable2FA(adminId, code);

      expect(result).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it("should disable 2FA with valid backup code", async () => {
      const adminId = "admin-1";
      const code = "BACKUP123";
      const mock2fa = {
        adminId,
        secret: "JBSWY3DPEHPK3PXP",
        backupCodes: ["BACKUP123", "BACKUP456"],
        enabled: true,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mock2fa]),
          }),
        }),
      });

      (authenticator.verify as jest.Mock).mockReturnValue(false);

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await service.disable2FA(adminId, code);

      expect(result).toBe(true);
    });

    it("should throw BadRequestException if 2FA not enabled", async () => {
      const adminId = "admin-1";
      const code = "123456";

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.disable2FA(adminId, code)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw UnauthorizedException for invalid code", async () => {
      const adminId = "admin-1";
      const code = "invalid";
      const mock2fa = {
        adminId,
        secret: "JBSWY3DPEHPK3PXP",
        backupCodes: [],
        enabled: true,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mock2fa]),
          }),
        }),
      });

      (authenticator.verify as jest.Mock).mockReturnValue(false);

      await expect(service.disable2FA(adminId, code)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("verify2FA", () => {
    it("should verify TOTP code successfully", async () => {
      const adminId = "admin-1";
      const code = "123456";
      const mock2fa = {
        adminId,
        secret: "JBSWY3DPEHPK3PXP",
        backupCodes: [],
        enabled: true,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mock2fa]),
          }),
        }),
      });

      (authenticator.verify as jest.Mock).mockReturnValue(true);

      const result = await service.verify2FA(adminId, code);

      expect(result).toBe(true);
    });

    it("should verify backup code successfully", async () => {
      const adminId = "admin-1";
      const code = "BACKUP123";
      const mock2fa = {
        adminId,
        secret: "JBSWY3DPEHPK3PXP",
        backupCodes: ["BACKUP123", "BACKUP456"],
        enabled: true,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mock2fa]),
          }),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const result = await service.verify2FA(adminId, code);

      expect(result).toBe(true);
      expect(mockDb.update).toHaveBeenCalled(); // Should remove used backup code
    });

    it("should return false if 2FA not enabled", async () => {
      const adminId = "admin-1";
      const code = "123456";

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.verify2FA(adminId, code);

      expect(result).toBe(false);
    });

    it("should return false for invalid code", async () => {
      const adminId = "admin-1";
      const code = "invalid";
      const mock2fa = {
        adminId,
        secret: "JBSWY3DPEHPK3PXP",
        backupCodes: [],
        enabled: true,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mock2fa]),
          }),
        }),
      });

      (authenticator.verify as jest.Mock).mockReturnValue(false);

      const result = await service.verify2FA(adminId, code);

      expect(result).toBe(false);
    });
  });

  describe("is2FAEnabled", () => {
    it("should return true if 2FA is enabled", async () => {
      const adminId = "admin-1";
      const mock2fa = {
        enabled: true,
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mock2fa]),
          }),
        }),
      });

      const result = await service.is2FAEnabled(adminId);

      expect(result).toBe(true);
    });

    it("should return false if 2FA is not enabled", async () => {
      const adminId = "admin-1";

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.is2FAEnabled(adminId);

      expect(result).toBe(false);
    });
  });
});

