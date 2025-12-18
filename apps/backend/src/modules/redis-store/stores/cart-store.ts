import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { KEY_PATTERNS, TTL } from "../constants/key-patterns";
import { ICartStore } from "../interfaces/redis-store.interface";
import { RedisStoreService } from "../redis-store.service";

@Injectable()
export class CartStore implements ICartStore, OnModuleInit {
  private client!: Redis;
  private readonly redisStoreService: RedisStoreService;

  constructor(
    redisStoreService: RedisStoreService,
    private readonly logger: PinoLogger,
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
   * Get cart key based on customerId or sessionId
   */
  private getCartKey(
    customerId: string | null,
    sessionId: string | null,
  ): string {
    if (customerId) {
      return KEY_PATTERNS.CART_CUSTOMER(customerId);
    }
    if (sessionId) {
      return KEY_PATTERNS.CART_SESSION(sessionId);
    }
    throw new BadRequestException(
      "Either customerId or sessionId must be provided",
    );
  }

  /**
   * Get cart data
   */
  async getCart(
    customerId: string | null,
    sessionId: string | null,
  ): Promise<unknown | null> {
    const key = this.getCartKey(customerId, sessionId);
    try {
      return await this.get(key);
    } catch (error) {
      this.logger.error(
        `Failed to get cart for customerId=${customerId}, sessionId=${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Store cart data
   */
  async setCart(
    customerId: string | null,
    sessionId: string | null,
    cartData: unknown,
    ttlSeconds: number = TTL.CART,
  ): Promise<void> {
    const key = this.getCartKey(customerId, sessionId);
    try {
      await this.set(key, cartData as string | number | object, ttlSeconds);
      this.logger.debug(
        `Cart stored for customerId=${customerId}, sessionId=${sessionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to set cart for customerId=${customerId}, sessionId=${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Remove cart
   */
  async deleteCart(
    customerId: string | null,
    sessionId: string | null,
  ): Promise<void> {
    const key = this.getCartKey(customerId, sessionId);
    try {
      await this.delete(key);
      this.logger.debug(
        `Cart deleted for customerId=${customerId}, sessionId=${sessionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete cart for customerId=${customerId}, sessionId=${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Extend cart expiration
   */
  async extendCartTTL(
    customerId: string | null,
    sessionId: string | null,
  ): Promise<void> {
    const key = this.getCartKey(customerId, sessionId);
    try {
      const exists = await this.exists(key);
      if (exists) {
        await this.client.expire(key, TTL.CART);
        this.logger.debug(
          `Cart TTL extended for customerId=${customerId}, sessionId=${sessionId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to extend cart TTL for customerId=${customerId}, sessionId=${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Check if cart exists
   */
  async cartExists(
    customerId: string | null,
    sessionId: string | null,
  ): Promise<boolean> {
    const key = this.getCartKey(customerId, sessionId);
    return this.exists(key);
  }
}
