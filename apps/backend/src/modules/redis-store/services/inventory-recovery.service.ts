import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InventoryStore } from "../stores/inventory-store";

/**
 * Inventory Recovery Service
 *
 * Runs recovery on module initialization to:
 * - Release expired reservations
 * - Reconcile aggregated reserved counts with individual reservations
 * - Fix inconsistencies
 *
 * TODO: Add periodic reconciliation (every 5-10 minutes)
 * - Use @nestjs/schedule or similar
 * - Run same reconciliation logic as onModuleInit
 * - Low frequency to avoid performance impact
 */
@Injectable()
export class InventoryRecoveryService implements OnModuleInit {
  private readonly logger = new Logger(InventoryRecoveryService.name);

  constructor(private readonly inventoryStore: InventoryStore) {}

  async onModuleInit() {
    this.logger.log("Starting inventory recovery service...");
    try {
      const result = await this.inventoryStore.reconcileReservations();
      this.logger.log(
        `Inventory recovery complete: ${result.released} expired reservations released, ${result.inconsistencies} inconsistencies fixed`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to run inventory recovery: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      // Don't throw - allow service to start even if recovery fails
    }
  }
}
