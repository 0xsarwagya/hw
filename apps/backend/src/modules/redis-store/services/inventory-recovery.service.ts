import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { RedisStoreService } from "../redis-store.service";
import { InventoryStore } from "../stores/inventory-store";

/**
 * Inventory Recovery Service
 *
 * Runs recovery on module initialization and periodically (every 7 minutes) to:
 * - Release expired reservations
 * - Reconcile aggregated reserved counts with individual reservations
 * - Fix inconsistencies
 * - Detect and handle orphaned reservations
 * - Fix negative and impossible inventory states
 * - Emit metrics for observability
 */
@Injectable()
export class InventoryRecoveryService implements OnModuleInit {
  private readonly logger = new Logger(InventoryRecoveryService.name);

  constructor(
    private readonly inventoryStore: InventoryStore,
    private readonly redisStoreService: RedisStoreService,
  ) {}

  async onModuleInit() {
    this.logger.log("Starting inventory recovery service...");
    try {
      const result = await this.inventoryStore.reconcileReservations();
      await this.emitMetrics(result);
      this.logger.log(
        `Inventory recovery complete: ${result.released} expired reservations released, ${result.inconsistencies} inconsistencies fixed, ${result.orphaned} orphaned reservations found, ${result.negativeCorrections} negative/impossible states corrected`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to run inventory recovery: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      // Don't throw - allow service to start even if recovery fails
    }
  }

  /**
   * Periodic reconciliation job (runs every 7 minutes)
   * Idempotent and safe under concurrency
   */
  @Cron("*/7 * * * *")
  async handleReconciliation() {
    this.logger.debug("Starting periodic inventory reconciliation...");
    try {
      const result = await this.inventoryStore.reconcileReservations();
      await this.emitMetrics(result);
      this.logger.log(
        `Periodic reconciliation complete: ${result.released} expired reservations released, ${result.inconsistencies} inconsistencies fixed, ${result.orphaned} orphaned reservations found, ${result.negativeCorrections} negative/impossible states corrected, ${result.variantsProcessed} variants processed`,
      );
    } catch (error) {
      // Fail closed - log error but don't throw
      // This ensures the worker continues running even if reconciliation fails
      this.logger.error(
        `Failed to run periodic reconciliation: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Emit metrics to Redis for observability
   * Metrics are stored as counters in Redis
   */
  private async emitMetrics(result: {
    released: number;
    inconsistencies: number;
    orphaned: number;
    negativeCorrections: number;
    variantsProcessed: number;
  }): Promise<void> {
    try {
      const redisClient = this.redisStoreService.getClient();

      // Increment run counter
      await redisClient.incr("inventory_reconciliation_runs");

      // Add to cumulative counters
      if (result.inconsistencies > 0) {
        await redisClient.incrby(
          "inventory_reconciliation_fixes",
          result.inconsistencies,
        );
      }

      if (result.orphaned > 0) {
        await redisClient.incrby(
          "inventory_orphaned_reservations",
          result.orphaned,
        );
      }

      if (result.negativeCorrections > 0) {
        await redisClient.incrby(
          "inventory_negative_corrections",
          result.negativeCorrections,
        );
      }
    } catch (error) {
      // Don't fail reconciliation if metrics emission fails
      this.logger.warn(
        `Failed to emit metrics: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
