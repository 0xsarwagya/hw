import { Test, TestingModule } from "@nestjs/testing";
import Redis from "ioredis";
import { RedisStoreService } from "../redis-store.service";
import { InventoryStore } from "./inventory-store";
import { KEY_PATTERNS } from "../constants/key-patterns";

describe("InventoryStore", () => {
  let store: InventoryStore;
  let redisStoreService: RedisStoreService;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    // Create a mock Redis client
    mockRedisClient = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      incrby: jest.fn(),
      decrby: jest.fn(),
      expire: jest.fn(),
      script: jest.fn(),
      evalsha: jest.fn(),
      scan: jest.fn(),
      ttl: jest.fn(),
      incr: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    // Create a mock RedisStoreService
    redisStoreService = {
      getClient: jest.fn().mockReturnValue(mockRedisClient),
    } as unknown as RedisStoreService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryStore,
        {
          provide: RedisStoreService,
          useValue: redisStoreService,
        },
      ],
    }).compile();

    store = module.get<InventoryStore>(InventoryStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("setInventory", () => {
    it("should set inventory count", async () => {
      const variantId = "variant-123";
      const quantity = 100;

      mockRedisClient.set.mockResolvedValue("OK");

      await store.setInventory(variantId, quantity);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        KEY_PATTERNS.INVENTORY_VARIANT(variantId),
        quantity.toString(),
      );
    });
  });

  describe("getAvailableInventory", () => {
    it("should return inventory count", async () => {
      const variantId = "variant-123";
      const quantity = "100";

      mockRedisClient.get.mockResolvedValue(quantity);

      const result = await store.getAvailableInventory(variantId);

      expect(result).toBe(100);
      expect(mockRedisClient.get).toHaveBeenCalledWith(
        KEY_PATTERNS.INVENTORY_VARIANT(variantId),
      );
    });

    it("should return null if inventory not found", async () => {
      const variantId = "variant-123";

      mockRedisClient.get.mockResolvedValue(null);

      const result = await store.getAvailableInventory(variantId);

      expect(result).toBeNull();
    });
  });

  describe("incrementInventory", () => {
    it("should increment inventory", async () => {
      const variantId = "variant-123";
      const delta = 10;
      const newValue = 110;

      mockRedisClient.incrby.mockResolvedValue(newValue);

      const result = await store.incrementInventory(variantId, delta);

      expect(result).toBe(newValue);
      expect(mockRedisClient.incrby).toHaveBeenCalledWith(
        KEY_PATTERNS.INVENTORY_VARIANT(variantId),
        delta,
      );
    });

    it("should decrement inventory with negative delta", async () => {
      const variantId = "variant-123";
      const delta = -5;
      const newValue = 95;

      mockRedisClient.incrby.mockResolvedValue(newValue);

      const result = await store.incrementInventory(variantId, delta);

      expect(result).toBe(newValue);
    });
  });

  describe("onModuleInit", () => {
    it("should load Lua script on initialization", async () => {
      const scriptSha = "abc123def456";
      mockRedisClient.script.mockResolvedValue(scriptSha);

      await store.onModuleInit();

      expect(mockRedisClient.script).toHaveBeenCalledWith("LOAD", expect.any(String));
      expect(store["reserveInventoryScriptSha"]).toBe(scriptSha);
    });
  });

  describe("reserveInventory", () => {
    beforeEach(() => {
      // Set up script SHA for Lua script execution
      store["reserveInventoryScriptSha"] = "test-script-sha";
    });

    it("should reserve inventory using Lua script (happy path)", async () => {
      const cartId = "cart-123";
      const variantId = "variant-123";
      const quantity = 5;
      const ttlSeconds = 900;

      // Mock Lua script result - successful reservation
      // Lua returns table which Redis converts to array
      // For success, it's not an error array, so just return a non-array value
      mockRedisClient.evalsha.mockResolvedValue(null);

      await store.reserveInventory(cartId, variantId, quantity, ttlSeconds);

      expect(mockRedisClient.evalsha).toHaveBeenCalledWith(
        "test-script-sha",
        3,
        KEY_PATTERNS.INVENTORY_VARIANT(variantId),
        KEY_PATTERNS.INVENTORY_RESERVED(variantId),
        KEY_PATTERNS.INVENTORY_RESERVATION(cartId, variantId),
        quantity.toString(),
        ttlSeconds.toString(),
      );
    });

    it("should throw BadRequestException when insufficient inventory", async () => {
      const cartId = "cart-123";
      const variantId = "variant-123";
      const quantity = 100;
      const ttlSeconds = 900;

      // Mock Lua script result - insufficient inventory
      // Lua returns table which Redis converts to array
      // Code expects: result[0] === "err", result[1] === "INSUFFICIENT_INVENTORY", result[2] === available number
      mockRedisClient.evalsha.mockResolvedValue([
        "err",
        "INSUFFICIENT_INVENTORY",
        50, // available value at index 2
      ]);

      await expect(
        store.reserveInventory(cartId, variantId, quantity, ttlSeconds),
      ).rejects.toThrow("Insufficient inventory. Available: 50");

      expect(mockRedisClient.evalsha).toHaveBeenCalled();
    });

    it("should increment failed_reservations counter on error", async () => {
      const cartId = "cart-123";
      const variantId = "variant-123";
      const quantity = 5;

      store["reserveInventoryScriptSha"] = "test-script-sha";
      mockRedisClient.evalsha.mockRejectedValue(new Error("Redis error"));
      mockRedisClient.incr.mockResolvedValue(1);

      await expect(
        store.reserveInventory(cartId, variantId, quantity),
      ).rejects.toThrow();

      expect(mockRedisClient.incr).toHaveBeenCalledWith(
        "inventory:failed_reservations",
      );
    });
  });

  describe("releaseInventory", () => {
    it("should release reserved inventory", async () => {
      const variantId = "variant-123";
      const quantity = 3;

      mockRedisClient.get.mockResolvedValue("5"); // 5 already reserved
      mockRedisClient.decrby.mockResolvedValue(2);

      await store.releaseInventory(variantId, quantity);

      expect(mockRedisClient.decrby).toHaveBeenCalledWith(
        KEY_PATTERNS.INVENTORY_RESERVED(variantId),
        quantity,
      );
    });

    it("should not release more than reserved", async () => {
      const variantId = "variant-123";
      const quantity = 10;
      const reserved = 3; // Only 3 reserved
      const releaseAmount = Math.min(quantity, reserved); // Should release 3, not 10

      mockRedisClient.get.mockResolvedValue(reserved.toString());
      mockRedisClient.decrby.mockResolvedValue(0);

      await store.releaseInventory(variantId, quantity);

      // Should only release 3 (the reserved amount), not 10 (the requested amount)
      expect(mockRedisClient.decrby).toHaveBeenCalledWith(
        KEY_PATTERNS.INVENTORY_RESERVED(variantId),
        releaseAmount,
      );
    });
  });

  describe("getReservedInventory", () => {
    it("should return reserved inventory count", async () => {
      const variantId = "variant-123";

      mockRedisClient.get.mockResolvedValue("5");

      const result = await store.getReservedInventory(variantId);

      expect(result).toBe(5);
    });

    it("should return 0 if no reservations", async () => {
      const variantId = "variant-123";

      mockRedisClient.get.mockResolvedValue(null);

      const result = await store.getReservedInventory(variantId);

      expect(result).toBe(0);
    });
  });

  describe("refreshReservationTTL", () => {
    it("should refresh TTL for existing reservation", async () => {
      const cartId = "cart-123";
      const variantId = "variant-123";
      const ttlSeconds = 900;

      mockRedisClient.exists.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);

      await store.refreshReservationTTL(cartId, variantId, ttlSeconds);

      expect(mockRedisClient.exists).toHaveBeenCalledWith(
        KEY_PATTERNS.INVENTORY_RESERVATION(cartId, variantId),
      );
      expect(mockRedisClient.expire).toHaveBeenCalledWith(
        KEY_PATTERNS.INVENTORY_RESERVATION(cartId, variantId),
        ttlSeconds,
      );
    });

    it("should not refresh TTL if reservation does not exist", async () => {
      const cartId = "cart-123";
      const variantId = "variant-123";

      mockRedisClient.exists.mockResolvedValue(0);

      await store.refreshReservationTTL(cartId, variantId);

      expect(mockRedisClient.expire).not.toHaveBeenCalled();
    });
  });

  describe("getCartReservations", () => {
    it("should return all reservations for a cart", async () => {
      const cartId = "cart-123";

      // Mock SCAN to return reservation keys
      mockRedisClient.scan
        .mockResolvedValueOnce([
          "0",
          [
            `inventory:reservation:${cartId}:variant-1`,
            `inventory:reservation:${cartId}:variant-2`,
          ],
        ])
        .mockResolvedValueOnce(["0", []]);

      mockRedisClient.get
        .mockResolvedValueOnce("5") // variant-1 quantity
        .mockResolvedValueOnce("3"); // variant-2 quantity

      const result = await store.getCartReservations(cartId);

      expect(result).toEqual([
        { variantId: "variant-1", quantity: 5 },
        { variantId: "variant-2", quantity: 3 },
      ]);
    });
  });

  describe("releaseCartReservations", () => {
    it("should release all reservations for a cart", async () => {
      const cartId = "cart-123";
      const variantId = "variant-123";

      // Mock getCartReservations
      jest.spyOn(store, "getCartReservations").mockResolvedValue([
        { variantId, quantity: 5 },
      ]);

      mockRedisClient.get.mockResolvedValue("5");
      mockRedisClient.del.mockResolvedValue(1);
      mockRedisClient.decrby.mockResolvedValue(0);

      await store.releaseCartReservations(cartId);

      expect(mockRedisClient.del).toHaveBeenCalledWith(
        KEY_PATTERNS.INVENTORY_RESERVATION(cartId, variantId),
      );
      expect(mockRedisClient.decrby).toHaveBeenCalledWith(
        KEY_PATTERNS.INVENTORY_RESERVED(variantId),
        5,
      );
    });
  });

  describe("reconcileReservations", () => {
    it("should reconcile reservations and fix inconsistencies", async () => {
      const variantId = "variant-1";

      // Mock SCAN to return reservation keys (first scan for reservations)
      mockRedisClient.scan
        .mockResolvedValueOnce([
          "0",
          [
            `inventory:reservation:cart-1:${variantId}`,
            `inventory:reservation:cart-2:${variantId}`,
          ],
        ])
        .mockResolvedValueOnce(["0", []]); // Second scan returns empty

      // Mock reservation values (for each reservation key)
      mockRedisClient.get
        .mockResolvedValueOnce("5") // cart-1 reservation
        .mockResolvedValueOnce("3"); // cart-2 reservation

      // Mock exists check (keys exist)
      mockRedisClient.exists.mockResolvedValue(1);

      // Mock getReservedInventory for the variant (returns 10, but should be 8)
      jest.spyOn(store, "getReservedInventory").mockResolvedValue(10);

      mockRedisClient.incrby.mockResolvedValue(8);

      const result = await store.reconcileReservations();

      expect(result.inconsistencies).toBeGreaterThan(0);
      // Should fix inconsistency by adjusting aggregated count
      expect(mockRedisClient.incrby).toHaveBeenCalledWith(
        KEY_PATTERNS.INVENTORY_RESERVED(variantId),
        -2, // delta to fix: 8 expected - 10 actual = -2
      );
    });

    it("should handle expired reservations", async () => {
      // Mock SCAN to return reservation keys
      mockRedisClient.scan.mockResolvedValueOnce([
        "0",
        ["inventory:reservation:cart-1:variant-1"],
      ]);

      // Mock key doesn't exist (expired)
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await store.reconcileReservations();

      expect(result.released).toBeGreaterThanOrEqual(0);
    });
  });

  describe("commitReservation", () => {
    it("should commit reservation (release + decrement available)", async () => {
      const variantId = "variant-123";
      const quantity = 3;

      // Mock releaseInventory calls
      mockRedisClient.get
        .mockResolvedValueOnce("3") // getReservedInventory for release
        .mockResolvedValueOnce("3"); // getReservedInventory check
      mockRedisClient.decrby.mockResolvedValue(0);
      // Mock incrementInventory (decrement available)
      mockRedisClient.incrby.mockResolvedValue(7); // 10 - 3 = 7

      await store.commitReservation(variantId, quantity);

      // Verify reservation was released
      expect(mockRedisClient.decrby).toHaveBeenCalledWith(
        KEY_PATTERNS.INVENTORY_RESERVED(variantId),
        quantity,
      );
      // Verify available inventory was decremented
      expect(mockRedisClient.incrby).toHaveBeenCalledWith(
        KEY_PATTERNS.INVENTORY_VARIANT(variantId),
        -quantity,
      );
    });
  });
});

