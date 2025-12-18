import { Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import { createLogContext } from "../../../common/logging/logging.helper";
import { KEY_PATTERNS, TTL } from "../constants/key-patterns";
import { IEligibilityStore } from "../interfaces/redis-store.interface";
import { RedisStoreService } from "../redis-store.service";

@Injectable()
export class EligibilityStore implements IEligibilityStore, OnModuleInit {
  private client!: Redis;
  private readonly redisStoreService: RedisStoreService;

  constructor(
    redisStoreService: RedisStoreService,
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
  ) {
    this.redisStoreService = redisStoreService;
  }

  async onModuleInit() {
    this.client = await this.redisStoreService.getClient();
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
   * Check if a key exists in Redis
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
   * Store eligibility set for a discount (variant IDs)
   */
  async storeEligibility(
    discountId: string,
    variantIds: string[],
  ): Promise<void> {
    const key = KEY_PATTERNS.DISCOUNT_ELIGIBILITY(discountId);
    try {
      if (variantIds.length === 0) {
        // Store empty set as empty array
        await this.set(key, [], TTL.DISCOUNT_ELIGIBILITY);
        this.logger.debug(
          `Stored empty eligibility set for discount ${discountId}`,
        );
        return;
      }

      // Use Redis SADD for efficient set operations
      await this.client.del(key); // Clear existing set
      if (variantIds.length > 0) {
        await this.client.sadd(key, ...variantIds);
        await this.client.expire(key, TTL.DISCOUNT_ELIGIBILITY);
      }
      this.logger.debug(
        `Stored eligibility set for discount ${discountId} with ${variantIds.length} variants`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to store eligibility for discount ${discountId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get eligibility set for a discount
   */
  async getEligibility(discountId: string): Promise<Set<string> | null> {
    const key = KEY_PATTERNS.DISCOUNT_ELIGIBILITY(discountId);
    try {
      const members = await this.client.smembers(key);
      if (members.length === 0) {
        // Check if key exists (empty set vs not cached)
        const exists = await this.exists(key);
        if (!exists) {
          return null; // Not cached
        }
        return new Set(); // Empty set (cached but no eligible variants)
      }
      return new Set(members);
    } catch (error) {
      this.logger.error(
        `Failed to get eligibility for discount ${discountId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null; // Return null on error to allow fallback
    }
  }

  /**
   * Check if a variant is eligible for a discount
   */
  async isVariantEligible(
    discountId: string,
    variantId: string,
  ): Promise<boolean> {
    const key = KEY_PATTERNS.DISCOUNT_ELIGIBILITY(discountId);
    try {
      const result = await this.client.sismember(key, variantId);
      return result === 1;
    } catch (error) {
      this.logger.error(
        `Failed to check eligibility for discount ${discountId}, variant ${variantId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return false; // Return false on error (safe default)
    }
  }

  /**
   * Invalidate eligibility for a discount
   */
  async invalidateEligibility(discountId: string): Promise<void> {
    const key = KEY_PATTERNS.DISCOUNT_ELIGIBILITY(discountId);
    try {
      await this.delete(key);
      this.logger.debug(
        createLogContext(this.contextService, "invalidateEligibility", {
          discountId,
        }),
        "Invalidated eligibility for discount",
      );
    } catch (error) {
      this.logger.error(
        `Failed to invalidate eligibility for discount ${discountId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Batch invalidate eligibility for multiple discounts
   */
  async invalidateEligibilityBatch(discountIds: string[]): Promise<void> {
    try {
      const keys = discountIds.map((id) =>
        KEY_PATTERNS.DISCOUNT_ELIGIBILITY(id),
      );
      if (keys.length > 0) {
        await this.client.del(...keys);
        this.logger.debug(
          `Invalidated eligibility for ${discountIds.length} discounts`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to batch invalidate eligibility: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }
}
