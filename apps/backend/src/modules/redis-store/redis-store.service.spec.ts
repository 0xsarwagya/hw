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
    it.skip("should initialize Redis connection", async () => {
      process.env.REDIS_URL = "redis://localhost:6379";

      await service.onModuleInit();

      expect(Redis).toHaveBeenCalled();
      // ping is called in initializeRedis which is async, wait a bit for it
      await new Promise((resolve) => setTimeout(resolve, 10));
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

    it("should initialize client when getClient is called before onModuleInit", async () => {
      // Create a fresh service instance without calling onModuleInit
      const logger = (service as any).logger;
      const contextService = (service as any).contextService;
      const newService = new RedisStoreService(logger, contextService);
      
      // Clear any existing client state
      (newService as any).client = null;
      (newService as any).initPromise = null;
      (newService as any).isInitializing = false;
      
      // getClient() should initialize the client automatically
      const client = await newService.getClient();
      
      // Should have created a client (mocked Redis instance)
      expect(client).toBeDefined();
      expect(Redis).toHaveBeenCalled();
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

