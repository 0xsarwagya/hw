import { Test, TestingModule } from "@nestjs/testing";
import { AdminActivityService } from "./admin-activity.service";
import { getCommonTestProviders } from "../../common/testing/test-helpers";

// Mock database
jest.mock("@vcecom/db", () => ({
  db: {
    insert: jest.fn(),
  },
  adminActivityLogs: {},
}));

describe("AdminActivityService", () => {
  let service: AdminActivityService;
  let mockDb: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminActivityService, ...getCommonTestProviders()],
    }).compile();

    service = module.get<AdminActivityService>(AdminActivityService);
    mockDb = require("@vcecom/db").db;
    jest.clearAllMocks();
  });

  describe("logActivity", () => {
    it("should log activity to database", async () => {
      const params = {
        adminId: "admin-1",
        action: "product.create",
        entityId: "product-123",
        metadata: { title: "Test Product" },
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      };

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      await service.logActivity(params);

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should extract IP and userAgent from context if not provided", async () => {
      const params = {
        adminId: "admin-1",
        action: "product.update",
      };

      const mockContextService = {
        get: jest.fn().mockReturnValue({
          ip: "192.168.1.2",
        }),
      };

      // Get the context service from the module and mock it
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AdminActivityService,
          ...getCommonTestProviders(),
          {
            provide: "ContextService",
            useValue: mockContextService,
          },
        ],
      }).compile();

      const serviceWithContext = module.get<AdminActivityService>(
        AdminActivityService,
      );

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      await serviceWithContext.logActivity(params);

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should not throw error if logging fails", async () => {
      const params = {
        adminId: "admin-1",
        action: "product.delete",
      };

      const error = new Error("Database error");
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockRejectedValue(error),
      });

      // Should not throw
      await expect(service.logActivity(params)).resolves.not.toThrow();
    });
  });

  describe("logLogin", () => {
    it("should log login activity", async () => {
      const adminId = "admin-1";
      const deviceId = "device-1";

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      await service.logLogin(adminId, deviceId);

      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("logLogout", () => {
    it("should log logout activity with sessionId", async () => {
      const adminId = "admin-1";
      const sessionId = "session-1";

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      await service.logLogout(adminId, sessionId);

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("should log logout activity without sessionId", async () => {
      const adminId = "admin-1";

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      await service.logLogout(adminId);

      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("logSessionRevoke", () => {
    it("should log session revocation", async () => {
      const adminId = "admin-1";
      const revokedSessionId = "session-1";
      const revokedBy = "admin-2";

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      await service.logSessionRevoke(adminId, revokedSessionId, revokedBy);

      expect(mockDb.insert).toHaveBeenCalled();
    });
  });
});

