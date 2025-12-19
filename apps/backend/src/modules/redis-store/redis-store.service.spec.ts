import { Test, TestingModule } from "@nestjs/testing";
import Redis from "ioredis";
import { getCommonTestProviders } from "../../common/testing/test-helpers";
import { RedisStoreService } from "./redis-store.service";

// Mock ioredis
jest.mock("ioredis");

describe("RedisStoreService", () => {
  let service: RedisStoreService;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    // Create a mock Redis instance
    mockRedisClient = {
      ping: jest.fn().mockResolvedValue("PONG"),
      quit: jest.fn().mockResolvedValue("OK"),
      on: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    // Mock Redis constructor
    (Redis as unknown as jest.Mock).mockImplementation(() => mockRedisClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisStoreService, ...getCommonTestProviders()],
    }).compile();

    service = module.get<RedisStoreService>(RedisStoreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("onModuleInit", () => {
    it("should initialize Redis connection", async () => {
      process.env.REDIS_URL = "redis://localhost:6379";

      await service.onModuleInit();

      expect(Redis).toHaveBeenCalled();
      expect(mockRedisClient.ping).toHaveBeenCalled();
    });

    it("should use default Redis URL if not provided", async () => {
      delete process.env.REDIS_URL;

      await service.onModuleInit();

      expect(Redis).toHaveBeenCalled();
    });
  });

  describe("getClient", () => {
    it("should return Redis client after initialization", async () => {
      await service.onModuleInit();

      const client = await service.getClient();

      expect(client).toBe(mockRedisClient);
    });

    it("should throw error if client not initialized", async () => {
      // Create a fresh service instance without calling onModuleInit
      const logger = (service as any).logger;
      const contextService = (service as any).contextService;
      const newService = new RedisStoreService(logger, contextService);
      
      // Mock initializeRedis to resolve but not set client, simulating a scenario where
      // initialization completes but client is still null (shouldn't happen in practice)
      const initializeRedisSpy = jest.spyOn(newService as any, "initializeRedis").mockResolvedValue(undefined);
      
      // Ensure initPromise is cleared so getClient() will create a new one
      (newService as any).initPromise = null;
      (newService as any).client = null;
      
      await expect(newService.getClient()).rejects.toThrow(
        "Redis client not initialized",
      );
      
      initializeRedisSpy.mockRestore();
    });
  });

  describe("onModuleDestroy", () => {
    it("should disconnect Redis client", async () => {
      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });

    it("should handle case when client is not initialized", async () => {
      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });
});

