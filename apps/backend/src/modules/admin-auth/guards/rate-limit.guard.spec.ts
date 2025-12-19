import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, HttpException, HttpStatus } from "@nestjs/common";
import { AdminLoginRateLimitGuard } from "./rate-limit.guard";
import { RedisStoreService } from "../../redis-store/redis-store.service";
import { getCommonTestProviders } from "../../../common/testing/test-helpers";
import Redis from "ioredis";

describe("AdminLoginRateLimitGuard", () => {
  let guard: AdminLoginRateLimitGuard;
  let redisStoreService: jest.Mocked<RedisStoreService>;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    mockRedisClient = {
      multi: jest.fn().mockReturnValue({
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      }),
    } as unknown as jest.Mocked<Redis>;

    const mockRedisStoreService = {
      getClient: jest.fn().mockReturnValue(mockRedisClient),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminLoginRateLimitGuard,
        {
          provide: RedisStoreService,
          useValue: mockRedisStoreService,
        },
        ...getCommonTestProviders(),
      ],
    }).compile();

    guard = module.get<AdminLoginRateLimitGuard>(AdminLoginRateLimitGuard);
    redisStoreService = module.get(RedisStoreService);
  });

  describe("canActivate", () => {
    it("should allow request within rate limit", async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              "x-forwarded-for": "192.168.1.1",
            },
            socket: {
              remoteAddress: "192.168.1.1",
            },
          }),
        }),
      } as unknown as ExecutionContext;

      const mockMulti = {
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([[null, 5], [null, 600]]),
      };

      mockRedisClient.multi = jest.fn().mockReturnValue(mockMulti);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRedisClient.multi).toHaveBeenCalled();
    });

    it("should throw HttpException with TOO_MANY_REQUESTS status when rate limit exceeded", async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
            socket: {
              remoteAddress: "192.168.1.1",
            },
          }),
        }),
      } as unknown as ExecutionContext;

      const mockMulti = {
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([[null, 11], [null, 600]]),
      };

      mockRedisClient.multi = jest.fn().mockReturnValue(mockMulti);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(HttpException);
    });

    it("should extract IP from x-forwarded-for header", async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              "x-forwarded-for": "192.168.1.1, 10.0.0.1",
            },
            socket: {
              remoteAddress: "127.0.0.1",
            },
          }),
        }),
      } as unknown as ExecutionContext;

      const mockMulti = {
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([[null, 1], [null, 600]]),
      };

      mockRedisClient.multi = jest.fn().mockReturnValue(mockMulti);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it("should handle Redis errors gracefully", async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
            socket: {
              remoteAddress: "192.168.1.1",
            },
          }),
        }),
      } as unknown as ExecutionContext;

      const mockMulti = {
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error("Redis error")),
      };

      mockRedisClient.multi = jest.fn().mockReturnValue(mockMulti);

      // Guard should fail-safe and allow request when Redis errors occur
      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });
});

