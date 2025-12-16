import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import Redis from "ioredis";
import {
  CheckoutState,
  TRANSITION_RULES,
  validateTransition,
} from "../constants/checkout-states";
import { KEY_PATTERNS, TTL } from "../constants/key-patterns";
import { CheckoutSession } from "../dto/checkout-session.dto";
import { ICheckoutStore } from "../interfaces/redis-store.interface";
import { RedisStoreService } from "../redis-store.service";

@Injectable()
export class CheckoutStore implements ICheckoutStore, OnModuleInit {
  private readonly logger = new Logger(CheckoutStore.name);
  private readonly client: Redis;
  private transitionStateScriptSha: string | null = null;

  constructor(redisStoreService: RedisStoreService) {
    this.client = redisStoreService.getClient();
  }

  async onModuleInit() {
    // Load Lua script for atomic state transitions
    try {
      const scriptPath = join(__dirname, "../scripts/transition-state.lua");
      const script = readFileSync(scriptPath, "utf-8");
      this.transitionStateScriptSha = (await this.client.script(
        "LOAD",
        script,
      )) as string;
      this.logger.log("State transition Lua script loaded successfully");
    } catch (error) {
      // Try alternative path for production builds
      try {
        const altScriptPath = join(
          process.cwd(),
          "apps/backend/src/modules/redis-store/scripts/transition-state.lua",
        );
        const script = readFileSync(altScriptPath, "utf-8");
        this.transitionStateScriptSha = (await this.client.script(
          "LOAD",
          script,
        )) as string;
        this.logger.log(
          "State transition Lua script loaded successfully (alt path)",
        );
      } catch (_altError) {
        this.logger.error(
          `Failed to load state transition Lua script: ${error instanceof Error ? error.message : "Unknown error"}`,
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

  /**
   * Create a new checkout session
   * Creates session in CREATED state
   */
  async createSession(cartId: string): Promise<{
    sessionId: string;
    session: CheckoutSession;
  }> {
    const sessionId = randomUUID();
    const key = this.getSessionKey(sessionId);
    const now = new Date().toISOString();

    const session: CheckoutSession = {
      state: CheckoutState.CREATED,
      cartId,
      paymentIntentId: null,
      orderId: null,
      updatedAt: now,
    };

    try {
      await this.set(key, session, TTL.CHECKOUT_SESSION);
      this.logger.debug(
        `Checkout session created: sessionId=${sessionId}, cartId=${cartId}`,
      );
      return { sessionId, session };
    } catch (error) {
      this.logger.error(
        `Failed to create checkout session for cartId=${cartId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get checkout session by session ID
   */
  async getSession(sessionId: string): Promise<CheckoutSession | null> {
    const key = this.getSessionKey(sessionId);
    try {
      const session = await this.get<CheckoutSession>(key);
      return session;
    } catch (error) {
      this.logger.error(
        `Failed to get checkout session for sessionId=${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Atomically transition checkout session state
   * Validates transition against allowlist and throws if invalid
   */
  async transitionState(
    sessionId: string,
    from: CheckoutState,
    to: CheckoutState,
  ): Promise<void> {
    // Validate transition locally first (for better error messages)
    try {
      validateTransition(from, to);
    } catch (error) {
      // Convert Error to BadRequestException for consistency
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    const key = this.getSessionKey(sessionId);
    const updatedAt = new Date().toISOString();
    const allowedTransitions = TRANSITION_RULES[from];

    if (!this.transitionStateScriptSha) {
      throw new Error("State transition Lua script not loaded");
    }

    try {
      // Execute Lua script for atomic transition
      const result = await this.client.evalsha(
        this.transitionStateScriptSha,
        1, // Number of keys
        key, // KEYS[1]
        from, // ARGV[1]
        to, // ARGV[2]
        updatedAt, // ARGV[3]
        JSON.stringify(allowedTransitions), // ARGV[4]
      );

      // Handle Lua script result
      if (Array.isArray(result) && result[0] === "err") {
        const errorType = result[1] as string;
        if (errorType === "SESSION_NOT_FOUND") {
          throw new BadRequestException(
            `Checkout session ${sessionId} not found`,
          );
        }
        if (errorType === "INVALID_TRANSITION") {
          const current = result[2] as string;
          const expected = result[3] as string;
          throw new BadRequestException(
            `Invalid state transition: expected state ${expected}, but current state is ${current}`,
          );
        }
        if (errorType === "TRANSITION_NOT_ALLOWED") {
          const fromState = result[2] as string;
          const toState = result[3] as string;
          throw new BadRequestException(
            `Transition from ${fromState} to ${toState} is not allowed`,
          );
        }
        throw new BadRequestException(`State transition failed: ${errorType}`);
      }

      this.logger.debug(
        `State transition successful: sessionId=${sessionId}, ${from} → ${to}`,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        (error instanceof Error && error.message.includes("transition"))
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to transition state for sessionId=${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Set payment intent ID in checkout session
   */
  async setPaymentIntent(
    sessionId: string,
    paymentIntentId: string,
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new BadRequestException(`Checkout session ${sessionId} not found`);
    }

    const key = this.getSessionKey(sessionId);
    const updated: CheckoutSession = {
      ...session,
      paymentIntentId,
      updatedAt: new Date().toISOString(),
    };

    try {
      await this.set(key, updated, TTL.CHECKOUT_SESSION);
      this.logger.debug(
        `Payment intent set: sessionId=${sessionId}, paymentIntentId=${paymentIntentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to set payment intent for sessionId=${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Set order ID in checkout session
   */
  async setOrder(sessionId: string, orderId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new BadRequestException(`Checkout session ${sessionId} not found`);
    }

    const key = this.getSessionKey(sessionId);
    const updated: CheckoutSession = {
      ...session,
      orderId,
      updatedAt: new Date().toISOString(),
    };

    try {
      await this.set(key, updated, TTL.CHECKOUT_SESSION);
      // Store reverse lookup mapping for finding session by orderId
      const orderMappingKey = KEY_PATTERNS.CHECKOUT_SESSION_BY_ORDER(orderId);
      await this.set(orderMappingKey, sessionId, TTL.CHECKOUT_SESSION);
      this.logger.debug(
        `Order ID set: sessionId=${sessionId}, orderId=${orderId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to set order ID for sessionId=${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get checkout session by order ID
   * Uses reverse lookup mapping
   * Returns both sessionId and session for convenience
   */
  async getSessionByOrderId(
    orderId: string,
  ): Promise<{ sessionId: string; session: CheckoutSession } | null> {
    try {
      const orderMappingKey = KEY_PATTERNS.CHECKOUT_SESSION_BY_ORDER(orderId);
      const sessionId = await this.get<string>(orderMappingKey);
      if (!sessionId) {
        return null;
      }
      const session = await this.getSession(sessionId);
      if (!session) {
        return null;
      }
      return { sessionId, session };
    } catch (error) {
      this.logger.error(
        `Failed to get checkout session by orderId=${orderId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Transition session to FAILED state and release checkout lock
   * Helper method for failure scenarios
   */
  async failSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      this.logger.warn(`Cannot fail session ${sessionId}: session not found`);
      return;
    }

    try {
      // Transition to FAILED state (idempotent if already FAILED)
      if (session.state !== CheckoutState.FAILED) {
        await this.transitionState(
          sessionId,
          session.state,
          CheckoutState.FAILED,
        );
      }

      // Release checkout lock
      await this.releaseCheckoutLock(session.cartId);

      this.logger.debug(
        `Session failed: sessionId=${sessionId}, cartId=${session.cartId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to fail session ${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      // Don't throw - failure handling should be best-effort
    }
  }

  /**
   * Assert that session is in expected state
   */
  async assertState(
    sessionId: string,
    expectedState: CheckoutState,
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new BadRequestException(`Checkout session ${sessionId} not found`);
    }

    if (session.state !== expectedState) {
      throw new BadRequestException(
        `Expected checkout session ${sessionId} to be in state ${expectedState}, but it is in state ${session.state}`,
      );
    }
  }

  /**
   * Assert that session is in one of the allowed states
   */
  async assertStateIn(
    sessionId: string,
    allowedStates: CheckoutState[],
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new BadRequestException(`Checkout session ${sessionId} not found`);
    }

    if (!allowedStates.includes(session.state)) {
      throw new BadRequestException(
        `Checkout session ${sessionId} is in state ${session.state}, but expected one of: ${allowedStates.join(", ")}`,
      );
    }
  }
}
