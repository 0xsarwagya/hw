import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { readFileSync } from "node:fs";
import Redis from "ioredis";
import { CheckoutState } from "../constants/checkout-states";
import { RedisStoreService } from "../redis-store.service";
import { CheckoutStore } from "./checkout-store";
import { KEY_PATTERNS, TTL } from "../constants/key-patterns";

jest.mock("node:fs");

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
      script: jest.fn(),
      evalsha: jest.fn(),
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

  describe("acquireCheckoutLock", () => {
    it("should acquire lock when cart is not locked", async () => {
      const cartId = "cart-123";
      const lockKey = KEY_PATTERNS.CHECKOUT_LOCK(cartId);
      const expectedTtl = TTL.CHECKOUT_LOCK * 1000; // Convert to milliseconds

      // SET key value PX ttl NX returns "OK" when key doesn't exist
      mockRedisClient.set.mockResolvedValue("OK");

      const result = await store.acquireCheckoutLock(cartId);

      expect(result).toBe(true);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        lockKey,
        expect.any(String), // timestamp value
        "PX",
        expectedTtl,
        "NX",
      );
    });

    it("should return false when cart is already locked", async () => {
      const cartId = "cart-123";
      const lockKey = KEY_PATTERNS.CHECKOUT_LOCK(cartId);

      // SET key value PX ttl NX returns null when key already exists
      mockRedisClient.set.mockResolvedValue(null);

      const result = await store.acquireCheckoutLock(cartId);

      expect(result).toBe(false);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        lockKey,
        expect.any(String),
        "PX",
        TTL.CHECKOUT_LOCK * 1000,
        "NX",
      );
    });

    it("should use custom TTL when provided", async () => {
      const cartId = "cart-123";
      const customTtlMs = 300000; // 5 minutes

      mockRedisClient.set.mockResolvedValue("OK");

      await store.acquireCheckoutLock(cartId, customTtlMs);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        KEY_PATTERNS.CHECKOUT_LOCK(cartId),
        expect.any(String),
        "PX",
        customTtlMs,
        "NX",
      );
    });

    it("should throw error on Redis failure", async () => {
      const cartId = "cart-123";
      const error = new Error("Redis connection failed");

      mockRedisClient.set.mockRejectedValue(error);

      await expect(store.acquireCheckoutLock(cartId)).rejects.toThrow(
        "Redis connection failed",
      );
    });
  });

  describe("releaseCheckoutLock", () => {
    it("should release lock successfully", async () => {
      const cartId = "cart-123";
      const lockKey = KEY_PATTERNS.CHECKOUT_LOCK(cartId);

      mockRedisClient.del.mockResolvedValue(1);

      await store.releaseCheckoutLock(cartId);

      expect(mockRedisClient.del).toHaveBeenCalledWith(lockKey);
    });

    it("should handle error when releasing lock", async () => {
      const cartId = "cart-123";
      const error = new Error("Redis deletion failed");

      mockRedisClient.del.mockRejectedValue(error);

      await expect(store.releaseCheckoutLock(cartId)).rejects.toThrow(
        "Redis deletion failed",
      );
    });
  });

  describe("isCheckoutLocked", () => {
    it("should return true when cart is locked", async () => {
      const cartId = "cart-123";
      const lockKey = KEY_PATTERNS.CHECKOUT_LOCK(cartId);

      mockRedisClient.exists.mockResolvedValue(1);

      const result = await store.isCheckoutLocked(cartId);

      expect(result).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith(lockKey);
    });

    it("should return false when cart is not locked", async () => {
      const cartId = "cart-123";
      const lockKey = KEY_PATTERNS.CHECKOUT_LOCK(cartId);

      mockRedisClient.exists.mockResolvedValue(0);

      const result = await store.isCheckoutLocked(cartId);

      expect(result).toBe(false);
      expect(mockRedisClient.exists).toHaveBeenCalledWith(lockKey);
    });

    it("should throw error on Redis failure", async () => {
      const cartId = "cart-123";
      const error = new Error("Redis connection failed");

      mockRedisClient.exists.mockRejectedValue(error);

      await expect(store.isCheckoutLocked(cartId)).rejects.toThrow(
        "Redis connection failed",
      );
    });
  });

  describe("createSession", () => {
    it("should create checkout session in CREATED state", async () => {
      const cartId = "cart-123";

      mockRedisClient.setex.mockResolvedValue("OK");

      const result = await store.createSession(cartId);

      expect(result.sessionId).toBeDefined();
      expect(result.session.state).toBe(CheckoutState.CREATED);
      expect(result.session.cartId).toBe(cartId);
      expect(result.session.paymentIntentId).toBeNull();
      expect(result.session.orderId).toBeNull();
      expect(result.session.updatedAt).toBeDefined();
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        expect.stringContaining("checkout:session:"),
        TTL.CHECKOUT_SESSION,
        expect.stringContaining(CheckoutState.CREATED),
      );
    });

    it("should throw error on Redis failure", async () => {
      const cartId = "cart-123";
      const error = new Error("Redis connection failed");

      mockRedisClient.setex.mockRejectedValue(error);

      await expect(store.createSession(cartId)).rejects.toThrow(
        "Redis connection failed",
      );
    });
  });

  describe("getSession", () => {
    it("should get checkout session", async () => {
      const sessionId = "session-123";
      const session = {
        state: CheckoutState.LOCKED,
        cartId: "cart-123",
        paymentIntentId: null,
        orderId: null,
        updatedAt: new Date().toISOString(),
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(session));

      const result = await store.getSession(sessionId);

      expect(result).toEqual(session);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        KEY_PATTERNS.CHECKOUT_SESSION(sessionId),
      );
    });

    it("should return null if session not found", async () => {
      const sessionId = "session-123";

      mockRedisClient.get.mockResolvedValue(null);

      const result = await store.getSession(sessionId);

      expect(result).toBeNull();
    });
  });

  describe("transitionState", () => {
    beforeEach(async () => {
      // Mock file system for Lua script loading
      (readFileSync as jest.Mock).mockReturnValue("-- mock lua script");
      // Mock Lua script loading
      mockRedisClient.script.mockResolvedValue("script-sha-123");
      // Initialize the store to load the script
      await store.onModuleInit();
    });

    it("should transition state successfully", async () => {
      const sessionId = "session-123";
      const session = {
        state: CheckoutState.CREATED,
        cartId: "cart-123",
        paymentIntentId: null,
        orderId: null,
        updatedAt: new Date().toISOString(),
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(session));
      mockRedisClient.evalsha.mockResolvedValue(["ok", CheckoutState.LOCKED]);

      await store.transitionState(
        sessionId,
        CheckoutState.CREATED,
        CheckoutState.LOCKED,
      );

      expect(mockRedisClient.evalsha).toHaveBeenCalled();
    });

    it("should throw error if session not found", async () => {
      const sessionId = "session-123";

      mockRedisClient.evalsha.mockResolvedValue([
        "err",
        "SESSION_NOT_FOUND",
      ]);

      await expect(
        store.transitionState(
          sessionId,
          CheckoutState.CREATED,
          CheckoutState.LOCKED,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw error if current state doesn't match", async () => {
      const sessionId = "session-123";

      mockRedisClient.evalsha.mockResolvedValue([
        "err",
        "INVALID_TRANSITION",
        CheckoutState.LOCKED,
        CheckoutState.CREATED,
      ]);

      await expect(
        store.transitionState(
          sessionId,
          CheckoutState.CREATED,
          CheckoutState.LOCKED,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw error if transition is not allowed", async () => {
      const sessionId = "session-123";

      mockRedisClient.evalsha.mockResolvedValue([
        "err",
        "TRANSITION_NOT_ALLOWED",
        CheckoutState.CREATED,
        CheckoutState.COMPLETED,
      ]);

      await expect(
        store.transitionState(
          sessionId,
          CheckoutState.CREATED,
          CheckoutState.COMPLETED,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should allow idempotent transitions (same state)", async () => {
      const sessionId = "session-123";
      const session = {
        state: CheckoutState.LOCKED,
        cartId: "cart-123",
        paymentIntentId: null,
        orderId: null,
        updatedAt: new Date().toISOString(),
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(session));
      mockRedisClient.evalsha.mockResolvedValue(["ok", CheckoutState.LOCKED]);

      // Same state transition should be allowed (idempotent)
      await store.transitionState(
        sessionId,
        CheckoutState.LOCKED,
        CheckoutState.LOCKED,
      );

      expect(mockRedisClient.evalsha).toHaveBeenCalled();
    });
  });

  describe("setPaymentIntent", () => {
    it("should set payment intent ID", async () => {
      const sessionId = "session-123";
      const paymentIntentId = "pay_123456";
      const session = {
        state: CheckoutState.LOCKED,
        cartId: "cart-123",
        paymentIntentId: null,
        orderId: null,
        updatedAt: new Date().toISOString(),
      };

      mockRedisClient.get
        .mockResolvedValueOnce(JSON.stringify(session))
        .mockResolvedValueOnce(JSON.stringify(session));
      mockRedisClient.setex.mockResolvedValue("OK");

      await store.setPaymentIntent(sessionId, paymentIntentId);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        KEY_PATTERNS.CHECKOUT_SESSION(sessionId),
        TTL.CHECKOUT_SESSION,
        expect.stringContaining(paymentIntentId),
      );
    });

    it("should throw error if session not found", async () => {
      const sessionId = "session-123";
      const paymentIntentId = "pay_123456";

      mockRedisClient.get.mockResolvedValue(null);

      await expect(
        store.setPaymentIntent(sessionId, paymentIntentId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("setOrder", () => {
    it("should set order ID and create reverse lookup", async () => {
      const sessionId = "session-123";
      const orderId = "order-123";
      const session = {
        state: CheckoutState.PAYMENT_CONFIRMED,
        cartId: "cart-123",
        paymentIntentId: "pay_123456",
        orderId: null,
        updatedAt: new Date().toISOString(),
      };

      mockRedisClient.get
        .mockResolvedValueOnce(JSON.stringify(session))
        .mockResolvedValueOnce(JSON.stringify(session));
      mockRedisClient.setex.mockResolvedValue("OK");

      await store.setOrder(sessionId, orderId);

      expect(mockRedisClient.setex).toHaveBeenCalledTimes(2);
      // First call: update session
      expect(mockRedisClient.setex).toHaveBeenNthCalledWith(
        1,
        KEY_PATTERNS.CHECKOUT_SESSION(sessionId),
        TTL.CHECKOUT_SESSION,
        expect.stringContaining(orderId),
      );
      // Second call: create reverse lookup
      expect(mockRedisClient.setex).toHaveBeenNthCalledWith(
        2,
        KEY_PATTERNS.CHECKOUT_SESSION_BY_ORDER(orderId),
        TTL.CHECKOUT_SESSION,
        sessionId,
      );
    });
  });

  describe("getSessionByOrderId", () => {
    it("should get session by order ID", async () => {
      const orderId = "order-123";
      const sessionId = "session-123";
      const session = {
        state: CheckoutState.ORDER_CREATED,
        cartId: "cart-123",
        paymentIntentId: "pay_123456",
        orderId,
        updatedAt: new Date().toISOString(),
      };

      mockRedisClient.get
        .mockResolvedValueOnce(sessionId)
        .mockResolvedValueOnce(JSON.stringify(session));

      const result = await store.getSessionByOrderId(orderId);

      expect(result).toEqual({ sessionId, session });
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        KEY_PATTERNS.CHECKOUT_SESSION_BY_ORDER(orderId),
      );
    });

    it("should return null if order mapping not found", async () => {
      const orderId = "order-123";

      mockRedisClient.get.mockResolvedValue(null);

      const result = await store.getSessionByOrderId(orderId);

      expect(result).toBeNull();
    });
  });

  describe("failSession", () => {
    beforeEach(async () => {
      // Mock file system for Lua script loading
      (readFileSync as jest.Mock).mockReturnValue("-- mock lua script");
      mockRedisClient.script.mockResolvedValue("script-sha-123");
      await store.onModuleInit();
    });

    it("should transition to FAILED and release lock", async () => {
      const sessionId = "session-123";
      const session = {
        state: CheckoutState.PAYMENT_PENDING,
        cartId: "cart-123",
        paymentIntentId: "pay_123456",
        orderId: null,
        updatedAt: new Date().toISOString(),
      };

      mockRedisClient.get
        .mockResolvedValueOnce(JSON.stringify(session))
        .mockResolvedValueOnce(JSON.stringify(session));
      mockRedisClient.evalsha.mockResolvedValue(["ok", CheckoutState.FAILED]);
      mockRedisClient.del.mockResolvedValue(1);

      await store.failSession(sessionId);

      expect(mockRedisClient.evalsha).toHaveBeenCalled();
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        KEY_PATTERNS.CHECKOUT_LOCK(session.cartId),
      );
    });

    it("should be idempotent if already FAILED", async () => {
      const sessionId = "session-123";
      const session = {
        state: CheckoutState.FAILED,
        cartId: "cart-123",
        paymentIntentId: null,
        orderId: null,
        updatedAt: new Date().toISOString(),
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(session));
      mockRedisClient.del.mockResolvedValue(1);

      await store.failSession(sessionId);

      // Should not call transitionState if already FAILED
      expect(mockRedisClient.evalsha).not.toHaveBeenCalled();
      expect(mockRedisClient.del).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const sessionId = "session-123";
      const session = {
        state: CheckoutState.PAYMENT_PENDING,
        cartId: "cart-123",
        paymentIntentId: "pay_123456",
        orderId: null,
        updatedAt: new Date().toISOString(),
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(session));
      mockRedisClient.evalsha.mockRejectedValue(new Error("Transition failed"));

      // Should not throw - failure handling is best-effort
      await expect(store.failSession(sessionId)).resolves.not.toThrow();
    });
  });

  describe("assertState", () => {
    it("should pass if state matches", async () => {
      const sessionId = "session-123";
      const session = {
        state: CheckoutState.LOCKED,
        cartId: "cart-123",
        paymentIntentId: null,
        orderId: null,
        updatedAt: new Date().toISOString(),
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(session));

      await expect(
        store.assertState(sessionId, CheckoutState.LOCKED),
      ).resolves.not.toThrow();
    });

    it("should throw if state doesn't match", async () => {
      const sessionId = "session-123";
      const session = {
        state: CheckoutState.CREATED,
        cartId: "cart-123",
        paymentIntentId: null,
        orderId: null,
        updatedAt: new Date().toISOString(),
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(session));

      await expect(
        store.assertState(sessionId, CheckoutState.LOCKED),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw if session not found", async () => {
      const sessionId = "session-123";

      mockRedisClient.get.mockResolvedValue(null);

      await expect(
        store.assertState(sessionId, CheckoutState.LOCKED),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("assertStateIn", () => {
    it("should pass if state is in allowed list", async () => {
      const sessionId = "session-123";
      const session = {
        state: CheckoutState.LOCKED,
        cartId: "cart-123",
        paymentIntentId: null,
        orderId: null,
        updatedAt: new Date().toISOString(),
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(session));

      await expect(
        store.assertStateIn(sessionId, [
          CheckoutState.LOCKED,
          CheckoutState.PAYMENT_PENDING,
        ]),
      ).resolves.not.toThrow();
    });

    it("should throw if state is not in allowed list", async () => {
      const sessionId = "session-123";
      const session = {
        state: CheckoutState.CREATED,
        cartId: "cart-123",
        paymentIntentId: null,
        orderId: null,
        updatedAt: new Date().toISOString(),
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(session));

      await expect(
        store.assertStateIn(sessionId, [
          CheckoutState.LOCKED,
          CheckoutState.PAYMENT_PENDING,
        ]),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

