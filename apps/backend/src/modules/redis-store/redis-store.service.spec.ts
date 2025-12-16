import { Test, TestingModule } from "@nestjs/testing";
import Redis from "ioredis";
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
      providers: [RedisStoreService],
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

      const client = service.getClient();

      expect(client).toBe(mockRedisClient);
    });

    it("should throw error if client not initialized", () => {
      expect(() => service.getClient()).toThrow(
        "Redis client not initialized",
      );
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

