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
import { PaymentIntent, PaymentIntentStatus } from "../dto/payment-intent.dto";
import { ICheckoutStore } from "../interfaces/redis-store.interface";
import { RedisStoreService } from "../redis-store.service";

@Injectable()
export class CheckoutStore implements ICheckoutStore, OnModuleInit {
  private readonly logger = new Logger(CheckoutStore.name);
  private readonly client: Redis;
  private transitionStateScriptSha: string | null = null;
  private createPaymentIntentScriptSha: string | null = null;

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

    // Load Lua script for atomic payment intent creation
    try {
      const scriptPath = join(
        __dirname,
        "../scripts/create-payment-intent.lua",
      );
      const script = readFileSync(scriptPath, "utf-8");
      this.createPaymentIntentScriptSha = (await this.client.script(
        "LOAD",
        script,
      )) as string;
      this.logger.log("Payment intent creation Lua script loaded successfully");
    } catch (error) {
      // Try alternative path for production builds
      try {
        const altScriptPath = join(
          process.cwd(),
          "apps/backend/src/modules/redis-store/scripts/create-payment-intent.lua",
        );
        const script = readFileSync(altScriptPath, "utf-8");
        this.createPaymentIntentScriptSha = (await this.client.script(
          "LOAD",
          script,
        )) as string;
        this.logger.log(
          "Payment intent creation Lua script loaded successfully (alt path)",
        );
      } catch (_altError) {
        this.logger.error(
          `Failed to load payment intent creation Lua script: ${error instanceof Error ? error.message : "Unknown error"}`,
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
   * Get checkout session key
   */
  private getSessionKey(sessionId: string): string {
    return KEY_PATTERNS.CHECKOUT_SESSION(sessionId);
  }

  /**
   * Acquire checkout lock for a cart
   */
  async acquireCheckoutLock(cartId: string, ttlMs?: number): Promise<boolean> {
    const key = KEY_PATTERNS.CHECKOUT_LOCK(cartId);
    const ttl = ttlMs ?? TTL.CHECKOUT_LOCK * 1000; // Convert seconds to milliseconds
    const lockValue = Date.now().toString(); // Store timestamp for debugging

    try {
      const result = await this.client.set(key, lockValue, "PX", ttl, "NX");
      if (result === "OK") {
        this.logger.debug(`Checkout lock acquired for cartId=${cartId}`);
        return true;
      }
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
    const key = KEY_PATTERNS.CHECKOUT_LOCK(cartId);
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
    const key = KEY_PATTERNS.CHECKOUT_LOCK(cartId);
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
   * Get payment intent key
   */
  private getPaymentIntentKey(checkoutSessionId: string): string {
    return KEY_PATTERNS.PAYMENT_INTENT(checkoutSessionId);
  }

  /**
   * Get reverse lookup key for payment intent
   */
  private getPaymentIntentReverseKey(paymentIntentId: string): string {
    return KEY_PATTERNS.PAYMENT_INTENT_BY_ID(paymentIntentId);
  }

  /**
   * Get payment intent for a checkout session
   */
  async getPaymentIntent(
    checkoutSessionId: string,
  ): Promise<PaymentIntent | null> {
    const key = this.getPaymentIntentKey(checkoutSessionId);
    try {
      const value = await this.get<PaymentIntent>(key);
      return value;
    } catch (error) {
      this.logger.error(
        `Failed to get payment intent for checkoutSessionId=${checkoutSessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Create or get payment intent atomically
   * Ensures exactly one payment intent per checkout session
   *
   * Flow:
   * 1. Check if payment intent exists (fast path)
   * 2. If not exists, atomically create placeholder using Lua script
   * 3. Only the process that created the placeholder calls the provider
   * 4. Update placeholder with real payment intent data
   */
  async createOrGetPaymentIntent(
    checkoutSessionId: string,
    createFn: () => Promise<PaymentIntent>,
  ): Promise<PaymentIntent> {
    if (!this.createPaymentIntentScriptSha) {
      throw new Error(
        "Payment intent creation Lua script not loaded. Check Redis connection and script file.",
      );
    }

    const intentKey = this.getPaymentIntentKey(checkoutSessionId);

    // Fast path: check if payment intent already exists
    const existing = await this.getPaymentIntent(checkoutSessionId);
    if (existing) {
      this.logger.debug(
        `Payment intent already exists for checkoutSessionId=${checkoutSessionId}, returning existing`,
      );
      return existing;
    }

    // Payment intent doesn't exist, need to create it atomically
    // Create a placeholder payment intent - we'll update it after provider call
    // Use empty paymentIntentId as marker that it's a placeholder
    const placeholderIntent: PaymentIntent = {
      paymentProvider: "razorpay",
      paymentIntentId: "", // Placeholder - will be set after provider call
      status: PaymentIntentStatus.CREATED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const placeholderJson = JSON.stringify(placeholderIntent);
    const tempReverseKey = this.getPaymentIntentReverseKey("temp");

    // Atomically create placeholder using Lua script
    // Only one process will succeed in creating the placeholder
    try {
      const result = (await this.client.evalsha(
        this.createPaymentIntentScriptSha,
        2, // Number of keys
        intentKey,
        tempReverseKey, // Temporary reverse lookup (will be updated after provider call)
        placeholderJson,
        checkoutSessionId,
        TTL.PAYMENT_INTENT.toString(),
      )) as [string, string, string];

      const [status, action, data] = result;

      if (status === "ok" && action === "EXISTS") {
        // Another process created it concurrently
        const existingIntent = JSON.parse(data) as PaymentIntent;

        // If it's still a placeholder (empty paymentIntentId), wait for it to be filled
        if (existingIntent.paymentIntentId === "") {
          // Wait a bit and retry (another process is calling provider)
          await new Promise((resolve) => setTimeout(resolve, 200));
          const retryExisting = await this.getPaymentIntent(checkoutSessionId);
          if (retryExisting && retryExisting.paymentIntentId !== "") {
            return retryExisting;
          }
          // If still placeholder after wait, return it (provider call might be slow)
          return existingIntent;
        }

        return existingIntent;
      } else if (status === "ok" && action === "CREATED") {
        // Successfully created placeholder atomically - this process owns the creation
        // Now call provider to create actual payment intent
        let paymentIntent: PaymentIntent;
        try {
          paymentIntent = await createFn();
        } catch (error) {
          // Provider call failed - delete placeholder, allow retry
          try {
            await this.delete(intentKey);
            await this.delete(tempReverseKey);
          } catch (deleteError) {
            this.logger.error(
              `Failed to delete placeholder after provider failure: ${deleteError instanceof Error ? deleteError.message : "Unknown error"}`,
            );
          }
          this.logger.error(
            `Payment provider call failed for checkoutSessionId=${checkoutSessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          throw error;
        }

        // Provider call succeeded, update placeholder with real data
        const updatedIntent: PaymentIntent = {
          ...paymentIntent,
          updatedAt: new Date().toISOString(),
        };
        const reverseLookupKey = this.getPaymentIntentReverseKey(
          paymentIntent.paymentIntentId,
        );

        try {
          // Update with real payment intent data
          await this.set(intentKey, updatedIntent, TTL.PAYMENT_INTENT);
          // Create proper reverse lookup
          await this.set(
            reverseLookupKey,
            checkoutSessionId,
            TTL.PAYMENT_INTENT,
          );
          // Delete temporary reverse lookup
          await this.delete(tempReverseKey);

          this.logger.debug(
            `Payment intent created and persisted: checkoutSessionId=${checkoutSessionId}, paymentIntentId=${paymentIntent.paymentIntentId}`,
          );
          return updatedIntent;
        } catch (updateError) {
          // Redis write failed after provider success - retry persistence
          this.logger.error(
            `Redis write failed after provider success for checkoutSessionId=${checkoutSessionId}, retrying...`,
            updateError,
          );

          // Retry: check if it was updated by another process
          const retryExisting = await this.getPaymentIntent(checkoutSessionId);
          if (retryExisting && retryExisting.paymentIntentId !== "") {
            this.logger.debug(
              `Payment intent was updated during retry for checkoutSessionId=${checkoutSessionId}, returning existing`,
            );
            return retryExisting;
          }

          // Retry persistence (single retry attempt)
          try {
            await this.set(intentKey, updatedIntent, TTL.PAYMENT_INTENT);
            await this.set(
              reverseLookupKey,
              checkoutSessionId,
              TTL.PAYMENT_INTENT,
            );
            await this.delete(tempReverseKey);
            this.logger.debug(
              `Payment intent persisted successfully on retry for checkoutSessionId=${checkoutSessionId}`,
            );
            return updatedIntent;
          } catch (retryError) {
            // Retry also failed - log but don't throw (payment intent exists in provider)
            this.logger.error(
              `Failed to persist payment intent after retry for checkoutSessionId=${checkoutSessionId}. Payment intent exists in provider but not in Redis.`,
              retryError,
            );
            // Return the payment intent anyway - it exists in provider
            // The next call will find it via provider or Redis will be eventually consistent
            return updatedIntent;
          }
        }
      } else {
        // Error case
        throw new Error(`Failed to create payment intent: ${action}`);
      }
    } catch (error) {
      // Lua script execution failed - fallback to simple SET NX
      this.logger.warn(
        `Lua script execution failed for checkoutSessionId=${checkoutSessionId}, falling back to SET NX: ${error instanceof Error ? error.message : "Unknown error"}`,
      );

      // Fallback: use SET NX directly
      const placeholderIntent: PaymentIntent = {
        paymentProvider: "razorpay",
        paymentIntentId: "",
        status: PaymentIntentStatus.CREATED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const created = await this.client.set(
        intentKey,
        JSON.stringify(placeholderIntent),
        "EX",
        TTL.PAYMENT_INTENT,
        "NX",
      );

      if (created !== "OK") {
        // Another process created it, fetch existing
        const existingIntent = await this.getPaymentIntent(checkoutSessionId);
        if (existingIntent) {
          return existingIntent;
        }
        throw new Error("Failed to create payment intent placeholder");
      }

      // Successfully created placeholder, call provider
      try {
        const paymentIntent = await createFn();
        const updatedIntent: PaymentIntent = {
          ...paymentIntent,
          updatedAt: new Date().toISOString(),
        };
        const reverseLookupKey = this.getPaymentIntentReverseKey(
          paymentIntent.paymentIntentId,
        );
        await this.set(intentKey, updatedIntent, TTL.PAYMENT_INTENT);
        await this.set(reverseLookupKey, checkoutSessionId, TTL.PAYMENT_INTENT);
        return updatedIntent;
      } catch (providerError) {
        // Provider failed, delete placeholder
        await this.delete(intentKey);
        throw providerError;
      }
    }
  }

  /**
   * Update payment intent status
   */
  async updatePaymentIntentStatus(
    checkoutSessionId: string,
    status: PaymentIntentStatus,
  ): Promise<void> {
    const paymentIntent = await this.getPaymentIntent(checkoutSessionId);
    if (!paymentIntent) {
      throw new BadRequestException(
        `Payment intent not found for checkoutSessionId=${checkoutSessionId}`,
      );
    }

    const updated: PaymentIntent = {
      ...paymentIntent,
      status,
      updatedAt: new Date().toISOString(),
    };

    const key = this.getPaymentIntentKey(checkoutSessionId);
    try {
      await this.set(key, updated, TTL.PAYMENT_INTENT);
      this.logger.debug(
        `Payment intent status updated: checkoutSessionId=${checkoutSessionId}, status=${status}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update payment intent status for checkoutSessionId=${checkoutSessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get payment intent by payment intent ID (reverse lookup)
   */
  async getPaymentIntentByPaymentId(
    paymentIntentId: string,
  ): Promise<PaymentIntent | null> {
    const reverseKey = this.getPaymentIntentReverseKey(paymentIntentId);
    try {
      const checkoutSessionId = await this.get<string>(reverseKey);
      if (!checkoutSessionId) {
        return null;
      }

      // Fetch payment intent using checkout session ID
      return await this.getPaymentIntent(checkoutSessionId);
    } catch (error) {
      this.logger.error(
        `Failed to get payment intent by paymentIntentId=${paymentIntentId}: ${error instanceof Error ? error.message : "Unknown error"}`,
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
    const session: CheckoutSession = {
      state: CheckoutState.CREATED,
      cartId,
      paymentIntentId: null,
      orderId: null,
      updatedAt: new Date().toISOString(),
    };

    const key = this.getSessionKey(sessionId);
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
      return await this.get<CheckoutSession>(key);
    } catch (error) {
      this.logger.error(
        `Failed to get checkout session ${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Atomically transition checkout session state
   */
  async transitionState(
    sessionId: string,
    from: CheckoutState,
    to: CheckoutState,
  ): Promise<void> {
    if (!this.transitionStateScriptSha) {
      throw new Error(
        "State transition Lua script not loaded. Check Redis connection and script file.",
      );
    }

    // Validate transition before calling Lua script
    try {
      validateTransition(from, to);
    } catch (error) {
      // Convert Error to BadRequestException for consistency
      if (error instanceof Error && error.message.includes("transition")) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    const key = this.getSessionKey(sessionId);
    const updatedAt = new Date().toISOString();
    const allowedTransitions = TRANSITION_RULES[from] || [];

    try {
      const result = (await this.client.evalsha(
        this.transitionStateScriptSha,
        1, // Number of keys
        key,
        from,
        to,
        updatedAt,
        JSON.stringify(allowedTransitions),
      )) as [string, string] | [string, string, string, string];

      const [status, ...rest] = result;

      if (status === "err") {
        const errorType = rest[0] as string;
        if (errorType === "SESSION_NOT_FOUND") {
          throw new BadRequestException(
            `Checkout session ${sessionId} not found`,
          );
        }
        if (errorType === "INVALID_TRANSITION") {
          const currentState = rest[1] as string;
          const expectedState = rest[2] as string;
          throw new BadRequestException(
            `Invalid state transition for session ${sessionId}: expected state ${expectedState}, but current state is ${currentState}`,
          );
        }
        if (errorType === "TRANSITION_NOT_ALLOWED") {
          const fromState = rest[1] as string;
          const toState = rest[2] as string;
          throw new BadRequestException(
            `Transition from ${fromState} to ${toState} is not allowed for session ${sessionId}`,
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
   */
  async failSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      this.logger.warn(
        `Checkout session ${sessionId} not found, skipping fail`,
      );
      return;
    }

    // If already FAILED, just release the lock (idempotent)
    if (session.state === CheckoutState.FAILED) {
      const cartId = session.cartId;
      if (cartId) {
        try {
          await this.releaseCheckoutLock(cartId);
        } catch (error) {
          this.logger.error(
            `Failed to release checkout lock for cartId=${cartId}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
      return;
    }

    try {
      // Transition to FAILED state
      await this.transitionState(
        sessionId,
        session.state,
        CheckoutState.FAILED,
      );

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

  /**
   * Create checkout session (legacy method - for backward compatibility)
   * @deprecated Use createSession instead
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
    } catch (error) {
      this.logger.error(
        `Failed to create checkout session ${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get checkout session (legacy method - for backward compatibility)
   * @deprecated Use getSession instead
   */
  async getCheckoutSession(sessionId: string): Promise<unknown | null> {
    return this.getSession(sessionId);
  }

  /**
   * Update checkout session (legacy method - for backward compatibility)
   * @deprecated Use transitionState or setOrder/setPaymentIntent instead
   */
  async updateCheckoutSession(
    sessionId: string,
    updates: Partial<unknown>,
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new BadRequestException(`Checkout session ${sessionId} not found`);
    }

    const key = this.getSessionKey(sessionId);
    // Merge updates into session, preserving state machine structure
    const updated: CheckoutSession = {
      ...session,
      ...(updates as Partial<CheckoutSession>),
      updatedAt: new Date().toISOString(),
    };

    try {
      await this.set(key, updated, TTL.CHECKOUT_SESSION);
    } catch (error) {
      this.logger.error(
        `Failed to update checkout session ${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Delete checkout session (legacy method - for backward compatibility)
   */
  async deleteCheckoutSession(sessionId: string): Promise<void> {
    const key = this.getSessionKey(sessionId);
    try {
      await this.delete(key);
    } catch (error) {
      this.logger.error(
        `Failed to delete checkout session ${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Extend session TTL (legacy method - for backward compatibility)
   */
  async extendSession(sessionId: string): Promise<void> {
    const key = this.getSessionKey(sessionId);
    try {
      await this.client.expire(key, TTL.CHECKOUT_SESSION);
    } catch (error) {
      this.logger.error(
        `Failed to extend checkout session ${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }
}
