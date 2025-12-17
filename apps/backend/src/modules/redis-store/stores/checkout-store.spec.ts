import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { readFileSync } from "node:fs";
import Redis from "ioredis";
import { getCommonTestProviders } from "../../../common/testing/test-helpers";
import { CheckoutState } from "../constants/checkout-states";
import { KEY_PATTERNS, TTL } from "../constants/key-patterns";
import { CheckoutSession } from "../dto/checkout-session.dto";
import {
  PaymentIntent,
  PaymentIntentStatus,
} from "../dto/payment-intent.dto";
import { RedisStoreService } from "../redis-store.service";
import { CheckoutStore } from "./checkout-store";

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
    
    // Mock client.set for fallback path (used in createOrGetPaymentIntent)
    (mockRedisClient.set as jest.Mock).mockResolvedValue("OK");

    redisStoreService = {
      getClient: jest.fn().mockReturnValue(mockRedisClient),
    } as unknown as RedisStoreService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutStore,
        ...getCommonTestProviders(),
        {
          provide: RedisStoreService,
          useValue: redisStoreService,
        },
      ],
    }).compile();

    store = module.get<CheckoutStore>(CheckoutStore);

    // Mock script loading
    (readFileSync as jest.Mock).mockReturnValue("some lua script");
    mockRedisClient.script.mockResolvedValue("sha123");
    await store.onModuleInit(); // Manually call onModuleInit

    // Ensure createPaymentIntentScriptSha is set for payment intent tests
    (store as any).createPaymentIntentScriptSha = "sha123";
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
      const existingSession: CheckoutSession = {
        state: CheckoutState.CREATED,
        cartId: "cart-123",
        paymentIntentId: null,
        orderId: "order-123",
        updatedAt: new Date().toISOString(),
      };
      const updates = { orderId: "order-456" };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingSession));
      mockRedisClient.setex.mockResolvedValue("OK");

      await store.updateCheckoutSession(sessionId, updates);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        KEY_PATTERNS.CHECKOUT_SESSION(sessionId),
        TTL.CHECKOUT_SESSION,
        expect.stringContaining('"orderId":"order-456"'),
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

      mockRedisClient.expire.mockResolvedValue(1);

      await store.extendSession(sessionId);

      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        KEY_PATTERNS.CHECKOUT_SESSION(sessionId),
        TTL.CHECKOUT_SESSION,
      );
    });

    it("should not extend TTL if session does not exist", async () => {
      const sessionId = "session-123";

      mockRedisClient.expire.mockResolvedValue(0);

      await store.extendSession(sessionId);

      expect(mockRedisClient.expire).toHaveBeenCalled();
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

  describe("getPaymentIntent", () => {
    it("should return payment intent when it exists", async () => {
      const checkoutSessionId = "checkout-session-123";
      const paymentIntent: PaymentIntent = {
        paymentProvider: "razorpay",
        paymentIntentId: "order_123456",
        status: PaymentIntentStatus.CREATED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(paymentIntent));

      const result = await store.getPaymentIntent(checkoutSessionId);

      expect(result).toEqual(paymentIntent);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        KEY_PATTERNS.PAYMENT_INTENT(checkoutSessionId),
      );
    });

    it("should return null when payment intent does not exist", async () => {
      const checkoutSessionId = "checkout-session-123";

      mockRedisClient.get.mockResolvedValue(null);

      const result = await store.getPaymentIntent(checkoutSessionId);

      expect(result).toBeNull();
    });
  });

  describe("createOrGetPaymentIntent", () => {
    const checkoutSessionId = "checkout-session-123";
    const paymentIntentId = "order_123456";
    const mockPaymentIntent: PaymentIntent = {
      paymentProvider: "razorpay",
      paymentIntentId,
      status: PaymentIntentStatus.CREATED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    beforeEach(() => {
      // Ensure createPaymentIntentScriptSha is set
      (store as any).createPaymentIntentScriptSha = "script-sha-123";
      // Clear any previous evalsha mocks
      mockRedisClient.evalsha.mockClear();
    });

    it("should return existing payment intent on retry", async () => {
      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockPaymentIntent));

      const createFn = jest.fn();

      const result = await store.createOrGetPaymentIntent(
        checkoutSessionId,
        createFn,
      );

      expect(result).toEqual(mockPaymentIntent);
      expect(createFn).not.toHaveBeenCalled();
    });

    it("should create new payment intent when it does not exist", async () => {
      // First call: payment intent doesn't exist
      mockRedisClient.get.mockResolvedValueOnce(null);
      // Lua script returns CREATED with placeholder
      mockRedisClient.evalsha.mockResolvedValueOnce([
        "ok",
        "CREATED",
        JSON.stringify({
          paymentProvider: "razorpay",
          paymentIntentId: "",
          status: PaymentIntentStatus.CREATED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      ]);
      // After provider call, update with real data
      mockRedisClient.setex.mockResolvedValue("OK");
      mockRedisClient.del.mockResolvedValue(1);

      const createFn = jest.fn().mockResolvedValue(mockPaymentIntent);

      const result = await store.createOrGetPaymentIntent(
        checkoutSessionId,
        createFn,
      );

      // Result should match payment intent structure (updatedAt may differ)
      expect(result.paymentProvider).toBe(mockPaymentIntent.paymentProvider);
      expect(result.paymentIntentId).toBe(mockPaymentIntent.paymentIntentId);
      expect(result.status).toBe(mockPaymentIntent.status);
      expect(createFn).toHaveBeenCalledTimes(1);
      // Should update placeholder with real payment intent data
      expect(mockRedisClient.setex).toHaveBeenCalled();
    });

    it("should handle concurrent creation (race condition)", async () => {
      // First check: doesn't exist
      mockRedisClient.get.mockResolvedValueOnce(null);
      // Lua script: another process created it concurrently
      mockRedisClient.evalsha.mockResolvedValueOnce([
        "ok",
        "EXISTS",
        JSON.stringify(mockPaymentIntent),
      ]);

      const createFn = jest.fn().mockResolvedValue(mockPaymentIntent);

      const result = await store.createOrGetPaymentIntent(
        checkoutSessionId,
        createFn,
      );

      expect(result).toEqual(mockPaymentIntent);
      // Provider should not be called if another process already created it
      expect(createFn).not.toHaveBeenCalled();
    });

    it("should handle provider failure (don't persist)", async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);
      // Lua script creates placeholder successfully
      mockRedisClient.evalsha.mockResolvedValueOnce([
        "ok",
        "CREATED",
        JSON.stringify({
          paymentProvider: "razorpay",
          paymentIntentId: "",
          status: PaymentIntentStatus.CREATED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      ]);
      // Mock delete for cleanup after provider failure (called for intentKey and tempReverseKey)
      mockRedisClient.del.mockResolvedValue(1);
      // Mock get for the delete check (not used but might be called)
      mockRedisClient.get.mockResolvedValueOnce(null);

      const createFn = jest
        .fn()
        .mockRejectedValue(new Error("Provider error"));

      await expect(
        store.createOrGetPaymentIntent(checkoutSessionId, createFn),
      ).rejects.toThrow("Provider error");

      // Provider should be called once (in the CREATED branch)
      // If it fails, placeholder is deleted and error is thrown
      expect(createFn).toHaveBeenCalled();
      // Should attempt to delete placeholder after provider failure
      // Note: del is called for both intentKey and tempReverseKey
      expect(mockRedisClient.del).toHaveBeenCalled();
    });

    it("should retry persistence on Redis write failure after provider success", async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);
      // Lua script creates placeholder successfully
      mockRedisClient.evalsha.mockResolvedValueOnce([
        "ok",
        "CREATED",
        JSON.stringify({
          paymentProvider: "razorpay",
          paymentIntentId: "",
          status: PaymentIntentStatus.CREATED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      ]);
      // First write fails (updating placeholder with real data)
      // First setex call fails (for intentKey) - this throws, so second call never happens
      mockRedisClient.setex.mockRejectedValueOnce(new Error("Redis error"));
      // Retry check: still placeholder (hasn't been updated yet)
      mockRedisClient.get.mockResolvedValueOnce(
        JSON.stringify({
          paymentProvider: "razorpay",
          paymentIntentId: "",
          status: PaymentIntentStatus.CREATED,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      );
      // Retry write succeeds (both intentKey and reverseLookupKey)
      mockRedisClient.setex.mockResolvedValue("OK");
      mockRedisClient.del.mockResolvedValue(1);

      const createFn = jest.fn().mockResolvedValue(mockPaymentIntent);

      const result = await store.createOrGetPaymentIntent(
        checkoutSessionId,
        createFn,
      );

      // Result should match payment intent structure (updatedAt may differ)
      expect(result.paymentProvider).toBe(mockPaymentIntent.paymentProvider);
      expect(result.paymentIntentId).toBe(mockPaymentIntent.paymentIntentId);
      expect(result.status).toBe(mockPaymentIntent.status);
      // Should retry persistence
      // First attempt: 1 call (fails), Retry attempt: 2 calls (both succeed)
      // Total: 3 calls (1 for intentKey in first attempt, 2 in retry)
      expect(mockRedisClient.setex).toHaveBeenCalledTimes(3);
    });
  });

  describe("updatePaymentIntentStatus", () => {
    it("should update payment intent status", async () => {
      const checkoutSessionId = "checkout-session-123";
      const existingIntent: PaymentIntent = {
        paymentProvider: "razorpay",
        paymentIntentId: "order_123456",
        status: PaymentIntentStatus.CREATED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(existingIntent));
      mockRedisClient.setex.mockResolvedValue("OK");

      await store.updatePaymentIntentStatus(
        checkoutSessionId,
        PaymentIntentStatus.CONFIRMED,
      );

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        KEY_PATTERNS.PAYMENT_INTENT(checkoutSessionId),
        TTL.PAYMENT_INTENT,
        expect.stringContaining('"status":"CONFIRMED"'),
      );
    });

    it("should throw if payment intent does not exist", async () => {
      const checkoutSessionId = "checkout-session-123";

      mockRedisClient.get.mockResolvedValue(null);

      await expect(
        store.updatePaymentIntentStatus(
          checkoutSessionId,
          PaymentIntentStatus.CONFIRMED,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getPaymentIntentByPaymentId", () => {
    it("should return payment intent via reverse lookup", async () => {
      const paymentIntentId = "order_123456";
      const checkoutSessionId = "checkout-session-123";
      const paymentIntent: PaymentIntent = {
        paymentProvider: "razorpay",
        paymentIntentId,
        status: PaymentIntentStatus.CREATED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Reverse lookup returns checkoutSessionId
      mockRedisClient.get
        .mockResolvedValueOnce(checkoutSessionId)
        .mockResolvedValueOnce(JSON.stringify(paymentIntent));

      const result = await store.getPaymentIntentByPaymentId(paymentIntentId);

      expect(result).toEqual(paymentIntent);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        KEY_PATTERNS.PAYMENT_INTENT_BY_ID(paymentIntentId),
      );
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        KEY_PATTERNS.PAYMENT_INTENT(checkoutSessionId),
      );
    });

    it("should return null when reverse lookup key does not exist", async () => {
      const paymentIntentId = "order_123456";

      mockRedisClient.get.mockResolvedValue(null);

      const result = await store.getPaymentIntentByPaymentId(paymentIntentId);

      expect(result).toBeNull();
    });
  });
});

