import { Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";
import { KEY_PATTERNS, TTL } from "../constants/key-patterns";
import { ICheckoutStore } from "../interfaces/redis-store.interface";
import { RedisStoreService } from "../redis-store.service";

@Injectable()
export class CheckoutStore implements ICheckoutStore {
  private readonly logger = new Logger(CheckoutStore.name);
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
   * Get checkout session key
   */
  private getSessionKey(sessionId: string): string {
    return KEY_PATTERNS.CHECKOUT_SESSION(sessionId);
  }

  /**
   * Create checkout session
   */
  async createCheckoutSession(
    sessionId: string,
    checkoutData: unknown,
  ): Promise<void> {
    const key = this.getSessionKey(sessionId);
    try {
      await this.set(
        key,
        checkoutData as string | number | object,
        TTL.CHECKOUT_SESSION,
      );
      this.logger.debug(`Checkout session created for sessionId=${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to create checkout session for sessionId=${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Retrieve checkout session
   */
  async getCheckoutSession(sessionId: string): Promise<unknown | null> {
    const key = this.getSessionKey(sessionId);
    try {
      return await this.get(key);
    } catch (error) {
      this.logger.error(
        `Failed to get checkout session for sessionId=${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Update checkout session data
   */
  async updateCheckoutSession(
    sessionId: string,
    updates: Partial<unknown>,
  ): Promise<void> {
    const key = this.getSessionKey(sessionId);
    try {
      const existing = await this.getCheckoutSession(sessionId);
      if (!existing) {
        throw new Error(`Checkout session ${sessionId} not found`);
      }

      const updated = { ...existing, ...updates };
      await this.set(
        key,
        updated as string | number | object,
        TTL.CHECKOUT_SESSION,
      );
      this.logger.debug(`Checkout session updated for sessionId=${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to update checkout session for sessionId=${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Remove checkout session
   */
  async deleteCheckoutSession(sessionId: string): Promise<void> {
    const key = this.getSessionKey(sessionId);
    try {
      await this.delete(key);
      this.logger.debug(`Checkout session deleted for sessionId=${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete checkout session for sessionId=${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Extend session TTL
   */
  async extendSession(sessionId: string): Promise<void> {
    const key = this.getSessionKey(sessionId);
    try {
      const exists = await this.exists(key);
      if (exists) {
        await this.client.expire(key, TTL.CHECKOUT_SESSION);
        this.logger.debug(
          `Checkout session TTL extended for sessionId=${sessionId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to extend checkout session TTL for sessionId=${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get checkout lock key
   */
  private getLockKey(cartId: string): string {
    return KEY_PATTERNS.CHECKOUT_LOCK(cartId);
  }

  /**
   * Acquire checkout lock for a cart
   * Uses atomic Redis SET NX PX operation to prevent concurrent checkouts
   */
  async acquireCheckoutLock(cartId: string, ttlMs?: number): Promise<boolean> {
    const key = this.getLockKey(cartId);
    const ttl = ttlMs ?? TTL.CHECKOUT_LOCK * 1000; // Convert seconds to milliseconds
    const lockValue = Date.now().toString(); // Store timestamp for debugging

    try {
      // Use SET key value NX PX ttl for atomic lock acquisition
      // NX = only set if key does not exist
      // PX = set expiration in milliseconds
      const result = await this.client.set(key, lockValue, "PX", ttl, "NX");

      if (result === "OK") {
        this.logger.debug(`Checkout lock acquired for cartId=${cartId}`);
        return true;
      }

      // Lock already exists
      this.logger.debug(`Checkout lock already exists for cartId=${cartId}`);
      return false;
    } catch (error) {
      this.logger.error(
        `Failed to acquire checkout lock for cartId=${cartId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Release checkout lock for a cart
   */
  async releaseCheckoutLock(cartId: string): Promise<void> {
    const key = this.getLockKey(cartId);
    try {
      await this.delete(key);
      this.logger.debug(`Checkout lock released for cartId=${cartId}`);
    } catch (error) {
      this.logger.error(
        `Failed to release checkout lock for cartId=${cartId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Check if a cart is currently locked for checkout
   */
  async isCheckoutLocked(cartId: string): Promise<boolean> {
    const key = this.getLockKey(cartId);
    try {
      return await this.exists(key);
    } catch (error) {
      this.logger.error(
        `Failed to check checkout lock status for cartId=${cartId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }
}
