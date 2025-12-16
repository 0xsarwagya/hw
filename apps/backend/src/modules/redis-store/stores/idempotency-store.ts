import { Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";
import { KEY_PATTERNS, TTL } from "../constants/key-patterns";
import { IIdempotencyStore } from "../interfaces/redis-store.interface";
import { RedisStoreService } from "../redis-store.service";

@Injectable()
export class IdempotencyStore implements IIdempotencyStore {
  private readonly logger = new Logger(IdempotencyStore.name);
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
   * Get idempotency key
   */
  private getIdempotencyKey(operation: string, key: string): string {
    return KEY_PATTERNS.IDEMPOTENCY(operation, key);
  }

  /**
   * Atomic check-and-set for idempotency
   * Returns true if key was set (first request), false if already exists
   */
  async checkAndSet(
    operation: string,
    key: string,
    value: string | number | object,
    ttlSeconds: number = TTL.IDEMPOTENCY,
  ): Promise<boolean> {
    const idempotencyKey = this.getIdempotencyKey(operation, key);
    try {
      const serialized =
        typeof value === "string" ? value : JSON.stringify(value);

      // Use SET with NX (only set if not exists) for atomic operation
      const result = await this.client.set(
        idempotencyKey,
        serialized,
        "EX",
        ttlSeconds,
        "NX",
      );

      const wasSet = result === "OK";
      if (wasSet) {
        this.logger.debug(
          `Idempotency key set for operation=${operation}, key=${key}`,
        );
      } else {
        this.logger.debug(
          `Idempotency key already exists for operation=${operation}, key=${key}`,
        );
      }

      return wasSet;
    } catch (error) {
      this.logger.error(
        `Failed to checkAndSet idempotency key for operation=${operation}, key=${key}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get idempotency result
   */
  async getIdempotencyResult<T = unknown>(
    operation: string,
    key: string,
  ): Promise<T | null> {
    const idempotencyKey = this.getIdempotencyKey(operation, key);
    return this.get<T>(idempotencyKey);
  }

  /**
   * Check if idempotency key exists
   */
  async idempotencyExists(operation: string, key: string): Promise<boolean> {
    const idempotencyKey = this.getIdempotencyKey(operation, key);
    return this.exists(idempotencyKey);
  }

  /**
   * Remove idempotency key
   */
  async deleteIdempotency(operation: string, key: string): Promise<void> {
    const idempotencyKey = this.getIdempotencyKey(operation, key);
    await this.delete(idempotencyKey);
  }
}
