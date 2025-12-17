import { Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";
import { DiscountResponseDto } from "../../discounts/dto/discount-response.dto";
import { KEY_PATTERNS } from "../constants/key-patterns";
import { IDiscountRuleStore } from "../interfaces/redis-store.interface";
import { RedisStoreService } from "../redis-store.service";

@Injectable()
export class DiscountRuleStore implements IDiscountRuleStore {
  private readonly logger = new Logger(DiscountRuleStore.name);
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
   * Store all active discount rules
   */
  async storeRules(rules: DiscountResponseDto[]): Promise<void> {
    const key = KEY_PATTERNS.DISCOUNT_RULES();
    try {
      await this.set(key, rules);
      this.logger.debug(`Stored ${rules.length} discount rules in Redis`);
    } catch (error) {
      this.logger.error(
        `Failed to store discount rules: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get all active discount rules from Redis
   */
  async getRules(): Promise<DiscountResponseDto[] | null> {
    const key = KEY_PATTERNS.DISCOUNT_RULES();
    try {
      const rules = await this.get<DiscountResponseDto[]>(key);
      if (rules) {
        this.logger.debug(
          `Retrieved ${rules.length} discount rules from Redis`,
        );
      }
      return rules;
    } catch (error) {
      this.logger.error(
        `Failed to get discount rules from Redis: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null; // Return null on error to allow fallback to DB
    }
  }

  /**
   * Invalidate discount rules cache
   */
  async invalidateRules(): Promise<void> {
    const key = KEY_PATTERNS.DISCOUNT_RULES();
    try {
      await this.delete(key);
      this.logger.debug("Invalidated discount rules cache");
    } catch (error) {
      this.logger.error(
        `Failed to invalidate discount rules cache: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }
}
