import { Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";
import { KEY_PATTERNS, TTL } from "../constants/key-patterns";
import { IInventoryStore } from "../interfaces/redis-store.interface";
import { RedisStoreService } from "../redis-store.service";

@Injectable()
export class InventoryStore implements IInventoryStore {
  private readonly logger = new Logger(InventoryStore.name);
  private readonly client: Redis;

  constructor(redisStoreService: RedisStoreService) {
    this.client = redisStoreService.getClient();
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
   * Reserve inventory for a variant
   */
  async reserveInventory(
    variantId: string,
    quantity: number,
    ttlSeconds: number = TTL.INVENTORY_RESERVATION,
  ): Promise<void> {
    const reservedKey = KEY_PATTERNS.INVENTORY_RESERVED(variantId);
    try {
      const currentReserved = await this.getReservedInventory(variantId);
      const newReserved = currentReserved + quantity;

      // Use INCRBY for atomic increment, then set TTL
      await this.client.incrby(reservedKey, quantity);
      await this.client.expire(reservedKey, ttlSeconds);

      this.logger.debug(
        `Reserved ${quantity} units of inventory for variant ${variantId}. Total reserved: ${newReserved}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to reserve inventory for variant ${variantId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Release reserved inventory
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
}
