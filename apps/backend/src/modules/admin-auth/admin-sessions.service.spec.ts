import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { AdminSessionsService } from "./admin-sessions.service";
import { getCommonTestProviders } from "../../common/testing/test-helpers";
import { DB_TOKEN } from "../../modules/database/database.module";
import * as argon2 from "argon2";

// Mock database
const mockDb = {
  insert: jest.fn(),
  select: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock("@vcecom/db", () => ({
  adminSessions: {},
  eq: jest.fn(),
  gte: jest.fn(),
}));

// Mock argon2
jest.mock("argon2", () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe("AdminSessionsService", () => {
  let service: AdminSessionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSessionsService,
        ...getCommonTestProviders(),
        {
          provide: DB_TOKEN,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<AdminSessionsService>(AdminSessionsService);
    jest.clearAllMocks();
  });

  describe("createSession", () => {
    it("should create a new session with refresh token", async () => {
      const params = {
        adminId: "admin-1",
        deviceId: "device-1",
        userAgent: "Mozilla/5.0",
        ipAddress: "192.168.1.1",
      };

      const mockRefreshToken = "refresh-token-123";
      const mockRefreshTokenHash = "hashed-refresh-token";
      const mockSession = {
        id: "session-1",
        adminId: params.adminId,
        refreshTokenHash: mockRefreshTokenHash,
        deviceId: params.deviceId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(),
      };

      jest.spyOn(require("node:crypto"), "randomUUID").mockReturnValue(mockRefreshToken as any);
      (argon2.hash as jest.Mock).mockResolvedValue(mockRefreshTokenHash);
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockSession]),
        }),
      });

      const result = await service.createSession(params);

      expect(result.sessionId).toBe(mockSession.id);
      expect(result.refreshToken).toBe(mockRefreshToken);
      expect(result.refreshTokenHash).toBe(mockRefreshTokenHash);
      expect(argon2.hash).toHaveBeenCalledWith(mockRefreshToken);
    });

    it("should handle errors when creating session", async () => {
      const params = {
        adminId: "admin-1",
        deviceId: "device-1",
      };

      const error = new Error("Database error");
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(error),
        }),
      });

      await expect(service.createSession(params)).rejects.toThrow(error);
    });
  });

  describe("validateRefreshToken", () => {
    it("should validate refresh token and return session", async () => {
      const refreshToken = "refresh-token-123";
      const mockSessions = [
        {
          id: "session-1",
          adminId: "admin-1",
          deviceId: "device-1",
          refreshTokenHash: "hash-1",
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        },
        {
          id: "session-2",
          adminId: "admin-2",
          deviceId: "device-2",
          refreshTokenHash: "hash-2",
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockSessions),
        }),
      });

      (argon2.verify as jest.Mock)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await service.validateRefreshToken(refreshToken);

      expect(result.sessionId).toBe("session-2");
      expect(result.adminId).toBe("admin-2");
      expect(result.deviceId).toBe("device-2");
    });

    it("should throw UnauthorizedException for invalid refresh token", async () => {
      const refreshToken = "invalid-token";
      const mockSessions = [
        {
          id: "session-1",
          adminId: "admin-1",
          deviceId: "device-1",
          refreshTokenHash: "hash-1",
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockSessions),
        }),
      });

      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.validateRefreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("updateRefreshToken", () => {
    it("should update refresh token hash and lastUsedAt", async () => {
      const sessionId = "session-1";
      const newRefreshToken = "new-refresh-token";
      const newHash = "new-hash";

      (argon2.hash as jest.Mock).mockResolvedValue(newHash);
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await service.updateRefreshToken(sessionId, newRefreshToken);

      expect(argon2.hash).toHaveBeenCalledWith(newRefreshToken);
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe("deleteSession", () => {
    it("should delete a session", async () => {
      const sessionId = "session-1";

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await service.deleteSession(sessionId);

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe("deleteAllSessions", () => {
    it("should delete all sessions for an admin", async () => {
      const adminId = "admin-1";
      const deletedSessions = [
        { id: "session-1" },
        { id: "session-2" },
      ];

      mockDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue(deletedSessions),
        }),
      });

      const result = await service.deleteAllSessions(adminId);

      expect(result).toBe(2);
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe("getActiveSessions", () => {
    it("should return active sessions for an admin", async () => {
      const adminId = "admin-1";
      const now = new Date();
      const mockSessions = [
        {
          id: "session-1",
          deviceId: "device-1",
          userAgent: "Mozilla/5.0",
          ipAddress: "192.168.1.1",
          createdAt: new Date(now.getTime() - 1000 * 60 * 60),
          expiresAt: new Date(now.getTime() + 1000 * 60 * 60),
          lastUsedAt: new Date(now.getTime() - 1000 * 30),
        },
        {
          id: "session-2",
          deviceId: "device-2",
          userAgent: null,
          ipAddress: null,
          createdAt: new Date(now.getTime() - 1000 * 60 * 30),
          expiresAt: new Date(now.getTime() - 1000), // Expired
          lastUsedAt: new Date(now.getTime() - 1000 * 15),
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockSessions),
        }),
      });

      const result = await service.getActiveSessions(adminId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("session-1");
      expect(result[0].userAgent).toBe("Mozilla/5.0");
      expect(result[0].ipAddress).toBe("192.168.1.1");
    });

    it("should return empty array if no active sessions", async () => {
      const adminId = "admin-1";

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.getActiveSessions(adminId);

      expect(result).toEqual([]);
    });
  });

  describe("updateLastUsedAt", () => {
    it("should update lastUsedAt timestamp", async () => {
      const sessionId = "session-1";

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });

      await service.updateLastUsedAt(sessionId);

      expect(mockDb.update).toHaveBeenCalled();
    });
  });
});

