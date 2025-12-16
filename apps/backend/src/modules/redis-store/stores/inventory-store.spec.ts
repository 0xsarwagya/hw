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

  describe("reserveInventory", () => {
    it("should reserve inventory", async () => {
      const variantId = "variant-123";
      const quantity = 5;

      mockRedisClient.get.mockResolvedValue("0"); // No existing reservations
      mockRedisClient.incrby.mockResolvedValue(5);
      mockRedisClient.expire.mockResolvedValue(1);

      await store.reserveInventory(variantId, quantity);

      expect(mockRedisClient.incrby).toHaveBeenCalledWith(
        KEY_PATTERNS.INVENTORY_RESERVED(variantId),
        quantity,
      );
      expect(mockRedisClient.expire).toHaveBeenCalled();
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
});

