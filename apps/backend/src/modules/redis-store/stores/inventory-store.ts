import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import Redis from "ioredis";
import { KEY_PATTERNS, TTL } from "../constants/key-patterns";
import { IInventoryStore } from "../interfaces/redis-store.interface";
import { RedisStoreService } from "../redis-store.service";

@Injectable()
export class InventoryStore implements IInventoryStore, OnModuleInit {
  private readonly logger = new Logger(InventoryStore.name);
  private readonly client: Redis;
  private reserveInventoryScriptSha: string | null = null;

  constructor(redisStoreService: RedisStoreService) {
    this.client = redisStoreService.getClient();
  }

  async onModuleInit() {
    // Load Lua script
    try {
      // Handle both development and production paths
      const scriptPath = join(__dirname, "../scripts/reserve-inventory.lua");
      const script = readFileSync(scriptPath, "utf-8");
      this.reserveInventoryScriptSha = (await this.client.script(
        "LOAD",
        script,
      )) as string;
      this.logger.log("Reservation Lua script loaded successfully");
    } catch (error) {
      // Try alternative path for production builds
      try {
        const altScriptPath = join(
          process.cwd(),
          "apps/backend/src/modules/redis-store/scripts/reserve-inventory.lua",
        );
        const script = readFileSync(altScriptPath, "utf-8");
        this.reserveInventoryScriptSha = (await this.client.script(
          "LOAD",
          script,
        )) as string;
        this.logger.log(
          "Reservation Lua script loaded successfully (alt path)",
        );
      } catch (_altError) {
        this.logger.error(
          `Failed to load reservation Lua script: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        throw error;
      }
    }
  }

  /**
   * Get a value from Redis
   */
  async get<T = string>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (value === null) {
        return null;
      }
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      this.logger.error(
        `Failed to get key ${key}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Set a value in Redis
   */
  async set(
    key: string,
    value: string | number | object,
    ttlSeconds?: number,
  ): Promise<void> {
    try {
      const serialized =
        typeof value === "string" ? value : JSON.stringify(value);
      if (ttlSeconds !== undefined) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(
        `Failed to set key ${key}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Delete a key from Redis
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(
        `Failed to delete key ${key}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(
        `Failed to check existence of key ${key}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Reserve inventory for a variant (atomic operation using Lua script)
   */
  async reserveInventory(
    cartId: string,
    variantId: string,
    quantity: number,
    ttlSeconds: number = TTL.INVENTORY_RESERVATION,
  ): Promise<void> {
    if (!this.reserveInventoryScriptSha) {
      throw new Error("Reservation Lua script not loaded");
    }

    const inventoryKey = KEY_PATTERNS.INVENTORY_VARIANT(variantId);
    const reservedKey = KEY_PATTERNS.INVENTORY_RESERVED(variantId);
    const reservationKey = KEY_PATTERNS.INVENTORY_RESERVATION(
      cartId,
      variantId,
    );

    try {
      const result = await this.client.evalsha(
        this.reserveInventoryScriptSha,
        3,
        inventoryKey,
        reservedKey,
        reservationKey,
        quantity.toString(),
        ttlSeconds.toString(),
      );

      // Handle Lua script result
      if (Array.isArray(result) && result[0] === "err") {
        if (result[1] === "INSUFFICIENT_INVENTORY") {
          const available = result[2] as number;
          throw new BadRequestException(
            `Insufficient inventory. Available: ${available}`,
          );
        }
        throw new Error(`Reservation failed: ${result[1]}`);
      }

      this.logger.debug(
        `Reserved ${quantity} units of inventory for cart ${cartId}, variant ${variantId}`,
      );
    } catch (error) {
      // Increment failed reservations counter
      try {
        await this.client.incr("inventory:failed_reservations");
      } catch {
        // Ignore counter increment errors
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Failed to reserve inventory for cart ${cartId}, variant ${variantId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Refresh TTL for a reservation
   */
  async refreshReservationTTL(
    cartId: string,
    variantId: string,
    ttlSeconds: number = TTL.INVENTORY_RESERVATION,
  ): Promise<void> {
    const reservationKey = KEY_PATTERNS.INVENTORY_RESERVATION(
      cartId,
      variantId,
    );
    try {
      const exists = await this.exists(reservationKey);
      if (exists) {
        await this.client.expire(reservationKey, ttlSeconds);
        this.logger.debug(
          `Refreshed TTL for reservation cart ${cartId}, variant ${variantId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to refresh TTL for reservation cart ${cartId}, variant ${variantId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Release reserved inventory (returns to available)
   * Use this for cart removals or TTL expiry
   */
  async releaseInventory(variantId: string, quantity: number): Promise<void> {
    const reservedKey = KEY_PATTERNS.INVENTORY_RESERVED(variantId);
    try {
      const currentReserved = await this.getReservedInventory(variantId);
      const releaseAmount = Math.min(quantity, currentReserved);

      if (releaseAmount > 0) {
        // Use atomic decrement
        await this.client.decrby(reservedKey, releaseAmount);
        this.logger.debug(
          `Released ${releaseAmount} units of inventory for variant ${variantId}`,
        );
      } else {
        this.logger.debug(
          `No inventory to release for variant ${variantId}. Requested: ${quantity}, Reserved: ${currentReserved}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to release inventory for variant ${variantId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Commit reservation (convert reserved → consumed)
   * Use this when an order is created to consume the reserved inventory
   * This releases the reservation AND decrements available inventory
   */
  async commitReservation(variantId: string, quantity: number): Promise<void> {
    try {
      // Release reservation (decrement reserved count)
      await this.releaseInventory(variantId, quantity);
      // Decrement available inventory (consume the inventory)
      await this.incrementInventory(variantId, -quantity);
      this.logger.debug(
        `Committed ${quantity} units of reserved inventory for variant ${variantId} (converted to consumed)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to commit reservation for variant ${variantId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get available inventory count
   */
  async getAvailableInventory(variantId: string): Promise<number | null> {
    const inventoryKey = KEY_PATTERNS.INVENTORY_VARIANT(variantId);
    try {
      const value = await this.client.get(inventoryKey);
      if (value === null) {
        return null;
      }
      return parseInt(value, 10);
    } catch (error) {
      this.logger.error(
        `Failed to get available inventory for variant ${variantId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Set inventory count (for sync with DB)
   */
  async setInventory(variantId: string, quantity: number): Promise<void> {
    const inventoryKey = KEY_PATTERNS.INVENTORY_VARIANT(variantId);
    try {
      await this.client.set(inventoryKey, quantity.toString());
      this.logger.debug(
        `Set inventory for variant ${variantId} to ${quantity}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to set inventory for variant ${variantId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Increment/decrement inventory
   */
  async incrementInventory(variantId: string, delta: number): Promise<number> {
    const inventoryKey = KEY_PATTERNS.INVENTORY_VARIANT(variantId);
    try {
      const newValue = await this.client.incrby(inventoryKey, delta);
      this.logger.debug(
        `Incremented inventory for variant ${variantId} by ${delta}. New value: ${newValue}`,
      );
      return newValue;
    } catch (error) {
      this.logger.error(
        `Failed to increment inventory for variant ${variantId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get reserved inventory count
   */
  async getReservedInventory(variantId: string): Promise<number> {
    const reservedKey = KEY_PATTERNS.INVENTORY_RESERVED(variantId);
    try {
      const value = await this.client.get(reservedKey);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      this.logger.error(
        `Failed to get reserved inventory for variant ${variantId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get all reservations for a cart
   */
  async getCartReservations(
    cartId: string,
  ): Promise<Array<{ variantId: string; quantity: number }>> {
    const pattern = KEY_PATTERNS.INVENTORY_RESERVATION(cartId, "*");
    const reservations: Array<{ variantId: string; quantity: number }> = [];

    try {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;

        for (const key of keys) {
          // Extract variantId from key: inventory:reservation:{cartId}:{variantId}
          const parts = key.split(":");
          if (
            parts.length === 4 &&
            parts[0] === "inventory" &&
            parts[1] === "reservation"
          ) {
            const variantId = parts[3];
            const quantityStr = await this.client.get(key);
            if (quantityStr) {
              reservations.push({
                variantId,
                quantity: parseInt(quantityStr, 10),
              });
            }
          }
        }
      } while (cursor !== "0");

      return reservations;
    } catch (error) {
      this.logger.error(
        `Failed to get cart reservations for cart ${cartId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Release all reservations for a cart
   */
  async releaseCartReservations(cartId: string): Promise<void> {
    const reservations = await this.getCartReservations(cartId);

    for (const reservation of reservations) {
      const reservationKey = KEY_PATTERNS.INVENTORY_RESERVATION(
        cartId,
        reservation.variantId,
      );
      const quantity = await this.getReservation(cartId, reservation.variantId);

      if (quantity !== null && quantity > 0) {
        // Delete individual reservation
        await this.delete(reservationKey);
        // Decrement aggregated reserved count
        await this.releaseInventory(reservation.variantId, quantity);
        this.logger.debug(
          `Released ${quantity} units for cart ${cartId}, variant ${reservation.variantId}`,
        );
      }
    }
  }

  /**
   * Get a specific reservation
   */
  async getReservation(
    cartId: string,
    variantId: string,
  ): Promise<number | null> {
    const reservationKey = KEY_PATTERNS.INVENTORY_RESERVATION(
      cartId,
      variantId,
    );
    try {
      const value = await this.client.get(reservationKey);
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      this.logger.error(
        `Failed to get reservation for cart ${cartId}, variant ${variantId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Reconcile reservations (for recovery after Redis restart)
   */
  async reconcileReservations(): Promise<{
    released: number;
    inconsistencies: number;
  }> {
    let released = 0;
    let inconsistencies = 0;

    try {
      // Scan for all reservation keys
      let cursor = "0";
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

      // Group reservations by variantId
      const variantReservations = new Map<
        string,
        Array<{ cartId: string; quantity: number }>
      >();

      for (const key of reservationKeys) {
        // Check if key exists (not expired)
        const exists = await this.client.exists(key);
        if (!exists) {
          // Key expired, extract info and release
          const parts = key.split(":");
          if (parts.length === 4) {
            const cartId = parts[2];
            const variantId = parts[3];
            released++;
            this.logger.debug(
              `Found expired reservation: cart ${cartId}, variant ${variantId}`,
            );
          }
          continue;
        }

        const parts = key.split(":");
        if (parts.length === 4) {
          const cartId = parts[2];
          const variantId = parts[3];
          const quantityStr = await this.client.get(key);
          const quantity = quantityStr ? parseInt(quantityStr, 10) : 0;

          if (!variantReservations.has(variantId)) {
            variantReservations.set(variantId, []);
          }
          variantReservations.get(variantId)?.push({ cartId, quantity });
        }
      }

      // Check aggregated reserved counts against individual reservations
      for (const [variantId, reservations] of variantReservations.entries()) {
        const expectedReserved = reservations.reduce(
          (sum, r) => sum + r.quantity,
          0,
        );
        const actualReserved = await this.getReservedInventory(variantId);

        if (expectedReserved !== actualReserved) {
          inconsistencies++;
          this.logger.warn(
            `Reservation inconsistency for variant ${variantId}: expected ${expectedReserved}, actual ${actualReserved}`,
          );
          // Fix inconsistency by adjusting aggregated count
          const delta = expectedReserved - actualReserved;
          if (delta > 0) {
            await this.client.incrby(
              KEY_PATTERNS.INVENTORY_RESERVED(variantId),
              delta,
            );
          } else {
            await this.client.incrby(
              KEY_PATTERNS.INVENTORY_RESERVED(variantId),
              delta,
            );
          }
        }
      }

      this.logger.log(
        `Reservation reconciliation complete: ${released} expired reservations released, ${inconsistencies} inconsistencies fixed`,
      );

      return { released, inconsistencies };
    } catch (error) {
      this.logger.error(
        `Failed to reconcile reservations: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }
}
