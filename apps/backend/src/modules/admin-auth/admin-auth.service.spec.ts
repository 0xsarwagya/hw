import { Test, TestingModule } from "@nestjs/testing";
import {
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AdminAuthService } from "./admin-auth.service";
import { AdminSessionsService } from "./admin-sessions.service";
import { AdminActivityService } from "./admin-activity.service";
import { AdminMfaService } from "./admin-mfa.service";
import { getCommonTestProviders } from "../../common/testing/test-helpers";
import { DB_TOKEN } from "../../modules/database/database.module";
import * as passwordUtils from "./utils/password.utils";

// Mock database
const mockDb = {
  select: jest.fn(),
  update: jest.fn(),
};

jest.mock("@vcecom/db", () => ({
  users: {},
  eq: jest.fn(),
}));

// Mock password utils
jest.mock("./utils/password.utils", () => ({
  verifyPassword: jest.fn(),
  isBcryptHash: jest.fn(),
  migratePasswordHash: jest.fn(),
}));

describe("AdminAuthService", () => {
  let service: AdminAuthService;
  let jwtService: JwtService;
  let sessionsService: jest.Mocked<AdminSessionsService>;
  let activityService: jest.Mocked<AdminActivityService>;
  let mfaService: jest.Mocked<AdminMfaService>;
  let mockDb: any;

  beforeEach(async () => {
    const mockSessionsService = {
      createSession: jest.fn(),
      validateRefreshToken: jest.fn(),
      updateRefreshToken: jest.fn(),
      updateLastUsedAt: jest.fn(),
      deleteSession: jest.fn(),
      deleteAllSessions: jest.fn(),
      getActiveSessions: jest.fn(),
    };

    const mockActivityService = {
      logLogin: jest.fn(),
      logLogout: jest.fn(),
      logActivity: jest.fn(),
    };

    const mockMfaService = {
      is2FAEnabled: jest.fn(),
      verify2FA: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue("mock-access-token"),
          },
        },
        {
          provide: AdminSessionsService,
          useValue: mockSessionsService,
        },
        {
          provide: AdminActivityService,
          useValue: mockActivityService,
        },
        {
          provide: AdminMfaService,
          useValue: mockMfaService,
        },
        {
          provide: DB_TOKEN,
          useValue: mockDb,
        },
        ...getCommonTestProviders(),
      ],
    }).compile();

    service = module.get<AdminAuthService>(AdminAuthService);
    jwtService = module.get<JwtService>(JwtService);
    sessionsService = module.get(AdminSessionsService);
    activityService = module.get(AdminActivityService);
    mfaService = module.get(AdminMfaService);
    jest.clearAllMocks();
  });

  describe("validateAdminCredentials", () => {
    it("should validate admin credentials successfully", async () => {
      const email = "admin@test.com";
      const password = "password123";
      const mockAdmin = {
        id: "admin-1",
        email,
        role: "admin",
        passwordHash: "hashed-password",
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockAdmin]),
          }),
        }),
      });

      (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
      (passwordUtils.isBcryptHash as jest.Mock).mockReturnValue(false);

      const result = await service.validateAdminCredentials(email, password);

      expect(result.id).toBe(mockAdmin.id);
      expect(result.email).toBe(email);
      expect(result.role).toBe("admin");
    });

    it("should throw UnauthorizedException for invalid email", async () => {
      const email = "invalid@test.com";
      const password = "password123";

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        service.validateAdminCredentials(email, password),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for invalid password", async () => {
      const email = "admin@test.com";
      const password = "wrong-password";
      const mockAdmin = {
        id: "admin-1",
        email,
        role: "admin",
        passwordHash: "hashed-password",
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockAdmin]),
          }),
        }),
      });

      (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateAdminCredentials(email, password),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for non-admin role", async () => {
      const email = "customer@test.com";
      const password = "password123";
      const mockUser = {
        id: "user-1",
        email,
        role: "customer",
        passwordHash: "hashed-password",
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(true);

      await expect(
        service.validateAdminCredentials(email, password),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should migrate bcrypt password to argon2id", async () => {
      const email = "admin@test.com";
      const password = "password123";
      const mockAdmin = {
        id: "admin-1",
        email,
        role: "admin",
        passwordHash: "$2b$10$oldhash",
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockAdmin]),
          }),
        }),
      });

      (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
      (passwordUtils.isBcryptHash as jest.Mock).mockReturnValue(true);
      (passwordUtils.migratePasswordHash as jest.Mock).mockResolvedValue(
        "new-argon2-hash",
      );

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await service.validateAdminCredentials(email, password);

      expect(passwordUtils.migratePasswordHash).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should login admin without 2FA", async () => {
      const admin = {
        id: "admin-1",
        email: "admin@test.com",
        role: "admin",
      };
      const deviceId = "device-1";

      mfaService.is2FAEnabled.mockResolvedValue(false);
      sessionsService.createSession.mockResolvedValue({
        sessionId: "session-1",
        refreshToken: "refresh-token",
        refreshTokenHash: "hash",
      });

      const result = await service.login(admin, deviceId);

      expect(result.accessToken).toBe("mock-access-token");
      expect(result.refreshToken).toBe("refresh-token");
      expect(result.requires2fa).toBe(false);
      expect(activityService.logLogin).toHaveBeenCalled();
    });

    it("should return requires2fa flag when 2FA is enabled", async () => {
      const admin = {
        id: "admin-1",
        email: "admin@test.com",
        role: "admin",
      };
      const deviceId = "device-1";

      mfaService.is2FAEnabled.mockResolvedValue(true);

      const result = await service.login(admin, deviceId);

      expect(result.requires2fa).toBe(true);
      expect(result.accessToken).toBe("");
      expect(result.refreshToken).toBe("");
      expect(sessionsService.createSession).not.toHaveBeenCalled();
    });
  });

  describe("refreshAccessToken", () => {
    it("should refresh access token with rotation", async () => {
      const refreshToken = "old-refresh-token";
      const mockSession = {
        sessionId: "session-1",
        adminId: "admin-1",
        deviceId: "device-1",
      };
      const mockAdmin = {
        id: "admin-1",
        email: "admin@test.com",
        role: "admin",
      };

      sessionsService.validateRefreshToken.mockResolvedValue(mockSession);
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockAdmin]),
          }),
        }),
      });
      sessionsService.updateRefreshToken.mockResolvedValue("new-hash");
      sessionsService.updateLastUsedAt.mockResolvedValue(undefined);

      const result = await service.refreshAccessToken(refreshToken);

      expect(result.accessToken).toBe("mock-access-token");
      expect(result.refreshToken).toBeDefined();
      expect(sessionsService.updateRefreshToken).toHaveBeenCalled();
    });

    it("should throw UnauthorizedException for invalid refresh token", async () => {
      const refreshToken = "invalid-token";

      sessionsService.validateRefreshToken.mockRejectedValue(
        new UnauthorizedException("Invalid token"),
      );

      await expect(service.refreshAccessToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("logout", () => {
    it("should logout from single device", async () => {
      const sessionId = "session-1";
      const adminId = "admin-1";

      sessionsService.deleteSession.mockResolvedValue(undefined);
      activityService.logLogout.mockResolvedValue(undefined);

      await service.logout(sessionId, adminId);

      expect(sessionsService.deleteSession).toHaveBeenCalledWith(sessionId);
      expect(activityService.logLogout).toHaveBeenCalledWith(adminId, sessionId);
    });
  });

  describe("logoutAll", () => {
    it("should logout from all devices", async () => {
      const adminId = "admin-1";

      sessionsService.deleteAllSessions.mockResolvedValue(2);
      activityService.logLogout.mockResolvedValue(undefined);

      await service.logoutAll(adminId);

      expect(sessionsService.deleteAllSessions).toHaveBeenCalledWith(adminId);
      expect(activityService.logLogout).toHaveBeenCalledWith(adminId);
    });
  });

  describe("verify2FAAndLogin", () => {
    it("should verify 2FA and complete login", async () => {
      const email = "admin@test.com";
      const code = "123456";
      const deviceId = "device-1";
      const mockAdmin = {
        id: "admin-1",
        email,
        role: "admin",
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockAdmin]),
          }),
        }),
      });

      mfaService.is2FAEnabled
        .mockResolvedValueOnce(true) // First call in verify2FAAndLogin
        .mockResolvedValueOnce(false); // Second call in login
      mfaService.verify2FA.mockResolvedValue(true);
      sessionsService.createSession.mockResolvedValue({
        sessionId: "session-1",
        refreshToken: "refresh-token",
        refreshTokenHash: "hash",
      });

      const result = await service.verify2FAAndLogin(email, code, deviceId);

      expect(result.accessToken).toBe("mock-access-token");
      expect(result.requires2fa).toBe(false);
    });

    it("should throw BadRequestException if 2FA not enabled", async () => {
      const email = "admin@test.com";
      const code = "123456";
      const deviceId = "device-1";
      const mockAdmin = {
        id: "admin-1",
        email,
        role: "admin",
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockAdmin]),
          }),
        }),
      });

      mfaService.is2FAEnabled.mockResolvedValue(false);

      await expect(
        service.verify2FAAndLogin(email, code, deviceId),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw UnauthorizedException for invalid 2FA code", async () => {
      const email = "admin@test.com";
      const code = "invalid";
      const deviceId = "device-1";
      const mockAdmin = {
        id: "admin-1",
        email,
        role: "admin",
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockAdmin]),
          }),
        }),
      });

      mfaService.is2FAEnabled.mockResolvedValue(true);
      mfaService.verify2FA.mockResolvedValue(false);

      await expect(
        service.verify2FAAndLogin(email, code, deviceId),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("getAdminInfo", () => {
    it("should get admin info with session count and 2FA status", async () => {
      const adminId = "admin-1";
      const mockAdmin = {
        id: adminId,
        email: "admin@test.com",
        role: "admin",
      };
      const mockSessions = [
        { id: "session-1", deviceId: "device-1" },
        { id: "session-2", deviceId: "device-2" },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockAdmin]),
          }),
        }),
      });

      sessionsService.getActiveSessions.mockResolvedValue(mockSessions);
      mfaService.is2FAEnabled.mockResolvedValue(true);

      const result = await service.getAdminInfo(adminId);

      expect(result.id).toBe(adminId);
      expect(result.activeSessionsCount).toBe(2);
      expect(result.has2fa).toBe(true);
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

      await expect(service.getAdminInfo(adminId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

