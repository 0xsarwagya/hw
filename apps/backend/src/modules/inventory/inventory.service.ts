import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { RedisStoreService } from "../redis-store/redis-store.service";
import { InventoryMetricsDto } from "./dto/inventory-metrics.dto";

@Injectable()
export class InventoryService implements OnModuleInit {
  private readonly logger = new Logger(InventoryService.name);
  private client!: Redis;
  private readonly redisStoreService: RedisStoreService;

  constructor(redisStoreService: RedisStoreService) {
    this.redisStoreService = redisStoreService;
  }

  async onModuleInit() {
    this.client = this.redisStoreService.getClient();
  }

  async getMetrics(): Promise<InventoryMetricsDto> {
    try {
      let totalAvailable = 0;
      let totalReserved = 0;
      let expiredReservationsCount = 0;

      // Scan for all inventory variant keys
      let cursor = "0";
      const variantKeys: string[] = [];
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          "MATCH",
          "inventory:variant:*",
          "COUNT",
          100,
        );
        cursor = nextCursor;
        variantKeys.push(...keys);
      } while (cursor !== "0");

      // Get available inventory for each variant
      for (const key of variantKeys) {
        const value = await this.client.get(key);
        if (value) {
          totalAvailable += parseInt(value, 10);
        }
      }

      // Scan for all reserved inventory keys
      cursor = "0";
      const reservedKeys: string[] = [];
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          "MATCH",
          "inventory:reserved:*",
          "COUNT",
          100,
        );
        cursor = nextCursor;
        reservedKeys.push(...keys);
      } while (cursor !== "0");

      // Get reserved inventory for each variant
      for (const key of reservedKeys) {
        const value = await this.client.get(key);
        if (value) {
          totalReserved += parseInt(value, 10);
        }
      }

      // Scan for expired reservation keys (keys that don't exist but should be counted)
      // We'll check individual reservations and count those that don't exist
      cursor = "0";
      const reservationKeys: string[] = [];
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          "MATCH",
          "inventory:reservation:*",
          "COUNT",
          100,
        );
        cursor = nextCursor;
        reservationKeys.push(...keys);
      } while (cursor !== "0");

      // Count expired reservations (this is approximate - actual expired keys are gone)
      // We'll use a different approach: check TTL on reservation keys
      for (const key of reservationKeys) {
        const ttl = await this.client.ttl(key);
        if (ttl === -2) {
          // Key doesn't exist (expired)
          expiredReservationsCount++;
        }
      }

      // Get failed reservations count
      const failedReservationsStr = await this.client.get(
        "inventory:failed_reservations",
      );
      const failedReservations = failedReservationsStr
        ? parseInt(failedReservationsStr, 10)
        : 0;

      // Calculate reserved ratio
      const totalInventory = totalAvailable + totalReserved;
      const reservedRatio =
        totalInventory > 0 ? (totalReserved / totalInventory) * 100 : 0;

      return {
        available: totalAvailable,
        reserved: totalReserved,
        reserved_ratio: Math.round(reservedRatio * 100) / 100, // Round to 2 decimal places
        expired_reservations_count: expiredReservationsCount,
        failed_reservations: failedReservations,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get inventory metrics: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }
}
