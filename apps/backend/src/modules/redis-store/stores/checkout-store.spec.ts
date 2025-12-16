import { Test, TestingModule } from "@nestjs/testing";
import Redis from "ioredis";
import { RedisStoreService } from "../redis-store.service";
import { CheckoutStore } from "./checkout-store";
import { KEY_PATTERNS, TTL } from "../constants/key-patterns";

describe("CheckoutStore", () => {
  let store: CheckoutStore;
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
        CheckoutStore,
        {
          provide: RedisStoreService,
          useValue: redisStoreService,
        },
      ],
    }).compile();

    store = module.get<CheckoutStore>(CheckoutStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createCheckoutSession", () => {
    it("should create checkout session", async () => {
      const sessionId = "session-123";
      const checkoutData = { orderId: "order-123", total: 100 };

      mockRedisClient.setex.mockResolvedValue("OK");

      await store.createCheckoutSession(sessionId, checkoutData);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        KEY_PATTERNS.CHECKOUT_SESSION(sessionId),
        TTL.CHECKOUT_SESSION,
        JSON.stringify(checkoutData),
      );
    });
  });

  describe("getCheckoutSession", () => {
    it("should get checkout session", async () => {
      const sessionId = "session-123";
      const checkoutData = { orderId: "order-123", total: 100 };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(checkoutData));

      const result = await store.getCheckoutSession(sessionId);

      expect(result).toEqual(checkoutData);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        KEY_PATTERNS.CHECKOUT_SESSION(sessionId),
      );
    });

    it("should return null if session not found", async () => {
      const sessionId = "session-123";

      mockRedisClient.get.mockResolvedValue(null);

      const result = await store.getCheckoutSession(sessionId);

      expect(result).toBeNull();
    });
  });

  describe("updateCheckoutSession", () => {
    it("should update checkout session", async () => {
      const sessionId = "session-123";
      const existingData = { orderId: "order-123", total: 100 };
      const updates = { total: 150 };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingData));
      mockRedisClient.setex.mockResolvedValue("OK");

      await store.updateCheckoutSession(sessionId, updates);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        KEY_PATTERNS.CHECKOUT_SESSION(sessionId),
        TTL.CHECKOUT_SESSION,
        JSON.stringify({ ...existingData, ...updates }),
      );
    });

    it("should throw error if session does not exist", async () => {
      const sessionId = "session-123";
      const updates = { total: 150 };

      mockRedisClient.get.mockResolvedValue(null);

      await expect(
        store.updateCheckoutSession(sessionId, updates),
      ).rejects.toThrow("Checkout session session-123 not found");
    });
  });

  describe("deleteCheckoutSession", () => {
    it("should delete checkout session", async () => {
      const sessionId = "session-123";

      mockRedisClient.del.mockResolvedValue(1);

      await store.deleteCheckoutSession(sessionId);

      expect(mockRedisClient.del).toHaveBeenCalledWith(
        KEY_PATTERNS.CHECKOUT_SESSION(sessionId),
      );
    });
  });

  describe("extendSession", () => {
    it("should extend session TTL if session exists", async () => {
      const sessionId = "session-123";

      mockRedisClient.exists.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);

      await store.extendSession(sessionId);

      expect(mockRedisClient.exists).toHaveBeenCalledWith(
        KEY_PATTERNS.CHECKOUT_SESSION(sessionId),
      );
      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        KEY_PATTERNS.CHECKOUT_SESSION(sessionId),
        TTL.CHECKOUT_SESSION,
      );
    });

    it("should not extend TTL if session does not exist", async () => {
      const sessionId = "session-123";

      mockRedisClient.exists.mockResolvedValue(0);

      await store.extendSession(sessionId);

      expect(mockRedisClient.exists).toHaveBeenCalled();
      expect(mockRedisClient.expire).not.toHaveBeenCalled();
    });
  });
});

