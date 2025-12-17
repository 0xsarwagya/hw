import { Test, TestingModule } from "@nestjs/testing";
import Redis from "ioredis";
import { getCommonTestProviders } from "../../../common/testing/test-helpers";
import { RedisStoreService } from "../redis-store.service";
import { IdempotencyStore } from "./idempotency-store";
import { KEY_PATTERNS, TTL } from "../constants/key-patterns";

describe("IdempotencyStore", () => {
  let store: IdempotencyStore;
  let redisStoreService: RedisStoreService;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    redisStoreService = {
      getClient: jest.fn().mockReturnValue(mockRedisClient),
    } as unknown as RedisStoreService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyStore,
        ...getCommonTestProviders(),
        {
          provide: RedisStoreService,
          useValue: redisStoreService,
        },
      ],
    }).compile();

    store = module.get<IdempotencyStore>(IdempotencyStore);
    
    // Manually call onModuleInit to initialize the Redis client
    await store.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("checkAndSet", () => {
    it("should return true when key is set (first request)", async () => {
      const operation = "order:create";
      const key = "req-123";
      const value = { orderId: "order-123" };

      mockRedisClient.set.mockResolvedValue("OK");

      const result = await store.checkAndSet(operation, key, value);

      expect(result).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        KEY_PATTERNS.IDEMPOTENCY(operation, key),
        JSON.stringify(value),
        "EX",
        TTL.IDEMPOTENCY,
        "NX",
      );
    });

    it("should return false when key already exists (duplicate request)", async () => {
      const operation = "order:create";
      const key = "req-123";
      const value = { orderId: "order-123" };

      mockRedisClient.set.mockResolvedValue(null);

      const result = await store.checkAndSet(operation, key, value);

      expect(result).toBe(false);
    });

    it("should use custom TTL if provided", async () => {
      const operation = "order:create";
      const key = "req-123";
      const value = { orderId: "order-123" };
      const customTTL = 3600;

      mockRedisClient.set.mockResolvedValue("OK");

      await store.checkAndSet(operation, key, value, customTTL);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        KEY_PATTERNS.IDEMPOTENCY(operation, key),
        JSON.stringify(value),
        "EX",
        customTTL,
        "NX",
      );
    });
  });

  describe("getIdempotencyResult", () => {
    it("should get idempotency result", async () => {
      const operation = "order:create";
      const key = "req-123";
      const value = { orderId: "order-123" };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(value));

      const result = await store.getIdempotencyResult(operation, key);

      expect(result).toEqual(value);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        KEY_PATTERNS.IDEMPOTENCY(operation, key),
      );
    });

    it("should return null if key does not exist", async () => {
      const operation = "order:create";
      const key = "req-123";

      mockRedisClient.get.mockResolvedValue(null);

      const result = await store.getIdempotencyResult(operation, key);

      expect(result).toBeNull();
    });
  });

  describe("idempotencyExists", () => {
    it("should return true if key exists", async () => {
      const operation = "order:create";
      const key = "req-123";

      mockRedisClient.exists.mockResolvedValue(1);

      const result = await store.idempotencyExists(operation, key);

      expect(result).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith(
        KEY_PATTERNS.IDEMPOTENCY(operation, key),
      );
    });

    it("should return false if key does not exist", async () => {
      const operation = "order:create";
      const key = "req-123";

      mockRedisClient.exists.mockResolvedValue(0);

      const result = await store.idempotencyExists(operation, key);

      expect(result).toBe(false);
    });
  });

  describe("deleteIdempotency", () => {
    it("should delete idempotency key", async () => {
      const operation = "order:create";
      const key = "req-123";

      mockRedisClient.del.mockResolvedValue(1);

      await store.deleteIdempotency(operation, key);

      expect(mockRedisClient.del).toHaveBeenCalledWith(
        KEY_PATTERNS.IDEMPOTENCY(operation, key),
      );
    });
  });
});

