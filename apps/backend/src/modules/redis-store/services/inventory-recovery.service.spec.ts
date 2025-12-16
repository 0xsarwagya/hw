import { Test, TestingModule } from "@nestjs/testing";
import Redis from "ioredis";
import { InventoryRecoveryService } from "./inventory-recovery.service";
import { InventoryStore } from "../stores/inventory-store";
import { RedisStoreService } from "../redis-store.service";

describe("InventoryRecoveryService", () => {
  let service: InventoryRecoveryService;
  let inventoryStore: jest.Mocked<InventoryStore>;
  let redisStoreService: jest.Mocked<RedisStoreService>;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    // Create a mock Redis client
    mockRedisClient = {
      incr: jest.fn(),
      incrby: jest.fn(),
    } as unknown as jest.Mocked<Redis>;

    // Create mock services
    inventoryStore = {
      reconcileReservations: jest.fn(),
    } as unknown as jest.Mocked<InventoryStore>;

    redisStoreService = {
      getClient: jest.fn().mockReturnValue(mockRedisClient),
    } as unknown as jest.Mocked<RedisStoreService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryRecoveryService,
        {
          provide: InventoryStore,
          useValue: inventoryStore,
        },
        {
          provide: RedisStoreService,
          useValue: redisStoreService,
        },
      ],
    }).compile();

    service = module.get<InventoryRecoveryService>(InventoryRecoveryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("onModuleInit", () => {
    it("should run reconciliation on module initialization", async () => {
      const mockResult = {
        released: 2,
        inconsistencies: 1,
        orphaned: 0,
        negativeCorrections: 0,
        variantsProcessed: 1,
      };

      inventoryStore.reconcileReservations.mockResolvedValue(mockResult);
      mockRedisClient.incr.mockResolvedValue(1);
      mockRedisClient.incrby.mockResolvedValue(1);

      await service.onModuleInit();

      expect(inventoryStore.reconcileReservations).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.incr).toHaveBeenCalledWith(
        "inventory_reconciliation_runs",
      );
      expect(mockRedisClient.incrby).toHaveBeenCalledWith(
        "inventory_reconciliation_fixes",
        1,
      );
    });

    it("should not throw if reconciliation fails", async () => {
      inventoryStore.reconcileReservations.mockRejectedValue(
        new Error("Reconciliation failed"),
      );

      await expect(service.onModuleInit()).resolves.not.toThrow();
    });
  });

  describe("handleReconciliation", () => {
    it("should call reconcileReservations and emit metrics", async () => {
      const mockResult = {
        released: 3,
        inconsistencies: 2,
        orphaned: 1,
        negativeCorrections: 1,
        variantsProcessed: 2,
      };

      inventoryStore.reconcileReservations.mockResolvedValue(mockResult);
      mockRedisClient.incr.mockResolvedValue(1);
      mockRedisClient.incrby.mockResolvedValue(1);

      await service.handleReconciliation();

      expect(inventoryStore.reconcileReservations).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.incr).toHaveBeenCalledWith(
        "inventory_reconciliation_runs",
      );
      expect(mockRedisClient.incrby).toHaveBeenCalledWith(
        "inventory_reconciliation_fixes",
        2,
      );
      expect(mockRedisClient.incrby).toHaveBeenCalledWith(
        "inventory_orphaned_reservations",
        1,
      );
      expect(mockRedisClient.incrby).toHaveBeenCalledWith(
        "inventory_negative_corrections",
        1,
      );
    });

    it("should not emit metrics for zero values", async () => {
      const mockResult = {
        released: 0,
        inconsistencies: 0,
        orphaned: 0,
        negativeCorrections: 0,
        variantsProcessed: 0,
      };

      inventoryStore.reconcileReservations.mockResolvedValue(mockResult);
      mockRedisClient.incr.mockResolvedValue(1);

      await service.handleReconciliation();

      expect(mockRedisClient.incr).toHaveBeenCalledWith(
        "inventory_reconciliation_runs",
      );
      expect(mockRedisClient.incrby).not.toHaveBeenCalledWith(
        "inventory_reconciliation_fixes",
        expect.any(Number),
      );
      expect(mockRedisClient.incrby).not.toHaveBeenCalledWith(
        "inventory_orphaned_reservations",
        expect.any(Number),
      );
      expect(mockRedisClient.incrby).not.toHaveBeenCalledWith(
        "inventory_negative_corrections",
        expect.any(Number),
      );
    });

    it("should not throw if reconciliation fails (fail closed)", async () => {
      inventoryStore.reconcileReservations.mockRejectedValue(
        new Error("Reconciliation failed"),
      );

      await expect(service.handleReconciliation()).resolves.not.toThrow();
    });

    it("should not throw if metrics emission fails", async () => {
      const mockResult = {
        released: 1,
        inconsistencies: 1,
        orphaned: 0,
        negativeCorrections: 0,
        variantsProcessed: 1,
      };

      inventoryStore.reconcileReservations.mockResolvedValue(mockResult);
      mockRedisClient.incr.mockRejectedValue(new Error("Redis error"));

      await expect(service.handleReconciliation()).resolves.not.toThrow();
    });

    it("should be idempotent (safe to run multiple times)", async () => {
      const mockResult = {
        released: 0,
        inconsistencies: 0,
        orphaned: 0,
        negativeCorrections: 0,
        variantsProcessed: 1,
      };

      inventoryStore.reconcileReservations.mockResolvedValue(mockResult);
      mockRedisClient.incr.mockResolvedValue(1);

      // Run multiple times
      await service.handleReconciliation();
      await service.handleReconciliation();
      await service.handleReconciliation();

      expect(inventoryStore.reconcileReservations).toHaveBeenCalledTimes(3);
      expect(mockRedisClient.incr).toHaveBeenCalledTimes(3);
    });
  });
});

