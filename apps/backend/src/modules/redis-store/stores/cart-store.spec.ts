import { Test, TestingModule } from "@nestjs/testing";
import Redis from "ioredis";
import { BadRequestException } from "@nestjs/common";
import { getCommonTestProviders } from "../../../common/testing/test-helpers";
import { RedisStoreService } from "../redis-store.service";
import { CartStore } from "./cart-store";
import { KEY_PATTERNS, TTL } from "../constants/key-patterns";

describe("CartStore", () => {
  let store: CartStore;
  let redisStoreService: RedisStoreService;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    redisStoreService = {
      getClient: jest.fn().mockReturnValue(mockRedisClient),
    } as unknown as RedisStoreService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartStore,
        ...getCommonTestProviders(),
        {
          provide: RedisStoreService,
          useValue: redisStoreService,
        },
      ],
    }).compile();

    store = module.get<CartStore>(CartStore);
    
    // Manually call onModuleInit to initialize the Redis client
    await store.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getCart", () => {
    it("should get cart for customer", async () => {
      const customerId = "customer-123";
      const cartData = { items: [], total: 0 };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cartData));

      const result = await store.getCart(customerId, null);

      expect(result).toEqual(cartData);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        KEY_PATTERNS.CART_CUSTOMER(customerId),
      );
    });

    it("should get cart for session", async () => {
      const sessionId = "session-123";
      const cartData = { items: [], total: 0 };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cartData));

      const result = await store.getCart(null, sessionId);

      expect(result).toEqual(cartData);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        KEY_PATTERNS.CART_SESSION(sessionId),
      );
    });

    it("should throw error if neither customerId nor sessionId provided", async () => {
      await expect(store.getCart(null, null)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should return null if cart not found", async () => {
      const customerId = "customer-123";

      mockRedisClient.get.mockResolvedValue(null);

      const result = await store.getCart(customerId, null);

      expect(result).toBeNull();
    });
  });

  describe("setCart", () => {
    it("should set cart for customer", async () => {
      const customerId = "customer-123";
      const cartData = { items: [], total: 0 };

      mockRedisClient.setex.mockResolvedValue("OK");

      await store.setCart(customerId, null, cartData);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        KEY_PATTERNS.CART_CUSTOMER(customerId),
        TTL.CART,
        JSON.stringify(cartData),
      );
    });

    it("should set cart for session", async () => {
      const sessionId = "session-123";
      const cartData = { items: [], total: 0 };

      mockRedisClient.setex.mockResolvedValue("OK");

      await store.setCart(null, sessionId, cartData);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        KEY_PATTERNS.CART_SESSION(sessionId),
        TTL.CART,
        JSON.stringify(cartData),
      );
    });

    it("should use custom TTL if provided", async () => {
      const customerId = "customer-123";
      const cartData = { items: [], total: 0 };
      const customTTL = 3600;

      mockRedisClient.setex.mockResolvedValue("OK");

      await store.setCart(customerId, null, cartData, customTTL);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        KEY_PATTERNS.CART_CUSTOMER(customerId),
        customTTL,
        JSON.stringify(cartData),
      );
    });
  });

  describe("deleteCart", () => {
    it("should delete cart for customer", async () => {
      const customerId = "customer-123";

      mockRedisClient.del.mockResolvedValue(1);

      await store.deleteCart(customerId, null);

      expect(mockRedisClient.del).toHaveBeenCalledWith(
        KEY_PATTERNS.CART_CUSTOMER(customerId),
      );
    });

    it("should delete cart for session", async () => {
      const sessionId = "session-123";

      mockRedisClient.del.mockResolvedValue(1);

      await store.deleteCart(null, sessionId);

      expect(mockRedisClient.del).toHaveBeenCalledWith(
        KEY_PATTERNS.CART_SESSION(sessionId),
      );
    });
  });

  describe("extendCartTTL", () => {
    it("should extend cart TTL if cart exists", async () => {
      const customerId = "customer-123";

      mockRedisClient.exists.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);

      await store.extendCartTTL(customerId, null);

      expect(mockRedisClient.exists).toHaveBeenCalledWith(
        KEY_PATTERNS.CART_CUSTOMER(customerId),
      );
      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        KEY_PATTERNS.CART_CUSTOMER(customerId),
        TTL.CART,
      );
    });

    it("should not extend TTL if cart does not exist", async () => {
      const customerId = "customer-123";

      mockRedisClient.exists.mockResolvedValue(0);

      await store.extendCartTTL(customerId, null);

      expect(mockRedisClient.exists).toHaveBeenCalled();
      expect(mockRedisClient.expire).not.toHaveBeenCalled();
    });
  });

  describe("cartExists", () => {
    it("should return true if cart exists", async () => {
      const customerId = "customer-123";

      mockRedisClient.exists.mockResolvedValue(1);

      const result = await store.cartExists(customerId, null);

      expect(result).toBe(true);
    });

    it("should return false if cart does not exist", async () => {
      const customerId = "customer-123";

      mockRedisClient.exists.mockResolvedValue(0);

      const result = await store.cartExists(customerId, null);

      expect(result).toBe(false);
    });
  });
});

