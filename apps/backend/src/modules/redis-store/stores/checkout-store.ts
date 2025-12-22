import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../../../common/logging/logging.helper";
import {
  CheckoutState,
  TRANSITION_RULES,
  validateTransition,
} from "../constants/checkout-states";
import { KEY_PATTERNS, TTL } from "../constants/key-patterns";
import { CheckoutMetadata } from "../dto/checkout-metadata.dto";
import { CheckoutSession } from "../dto/checkout-session.dto";
import { PaymentIntent, PaymentIntentStatus } from "../dto/payment-intent.dto";
import { ICheckoutStore } from "../interfaces/redis-store.interface";
import { RedisStoreService } from "../redis-store.service";

/**
 * Helper function to load Lua script with multiple path fallbacks
 */
function loadLuaScript(scriptName: string, currentDir: string): string {
  const scriptPaths = [
    // Compiled path (dist)
    join(currentDir, "../scripts", scriptName),
    // Source path from dist
    join(currentDir, "../../../src/modules/redis-store/scripts", scriptName),
    // Source path from process.cwd() (repo root)
    join(
      process.cwd(),
      "apps/backend/src/modules/redis-store/scripts",
      scriptName,
    ),
    // Absolute path fallback
    join(process.cwd(), "src/modules/redis-store/scripts", scriptName),
  ];

  for (const scriptPath of scriptPaths) {
    try {
      return readFileSync(scriptPath, "utf-8");
    } catch {}
  }

  throw new Error(
    `Failed to load Lua script '${scriptName}' from any of the following paths: ${scriptPaths.join(", ")}`,
  );
}

@Injectable()
export class CheckoutStore implements ICheckoutStore, OnModuleInit {
  private client!: Redis;
  private readonly redisStoreService: RedisStoreService;
  private transitionStateScriptSha: string | null = null;
  private createPaymentIntentScriptSha: string | null = null;
  private createOrderFromPaymentScriptSha: string | null = null;

  constructor(
    redisStoreService: RedisStoreService,
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
  ) {
    this.redisStoreService = redisStoreService;
  }

  /**
   * Reload the transition state Lua script
   * Useful when script content changes and needs to be refreshed
   */
  private async reloadTransitionStateScript(): Promise<void> {
    try {
      const script = loadLuaScript("transition-state.lua", __dirname);
      this.transitionStateScriptSha = (await this.client.script(
        "LOAD",
        script,
      )) as string;
      this.logger.info(
        createLogContext(this.contextService, "reloadTransitionStateScript", {
          scriptName: "transition-state.lua",
          newSha: this.transitionStateScriptSha,
        }),
        "State transition Lua script reloaded successfully",
      );
    } catch (error) {
      this.logger.error(
        createErrorContext(
          this.contextService,
          "reloadTransitionStateScript",
          error,
          {
            scriptName: "transition-state.lua",
          },
        ),
        "Failed to reload state transition Lua script",
      );
      throw error;
    }
  }

  async onModuleInit() {
    // Initialize Redis client - don't block if Redis is unavailable
    // Wrap entire initialization in timeout to prevent blocking
    try {
      const initPromise = (async () => {
        this.client = await this.redisStoreService.getClient();

        // Load Lua scripts with timeout to avoid blocking startup
        // Scripts will be loaded on first use if they fail here
        const loadScript = async (
          scriptName: string,
        ): Promise<string | null> => {
          try {
            const script = loadLuaScript(scriptName, __dirname);
            const sha = (await Promise.race([
              this.client.script("LOAD", script),
              new Promise<string>((_, reject) =>
                setTimeout(
                  () => reject(new Error("Script load timeout")),
                  2000,
                ),
              ),
            ])) as string;
            this.logger.info(
              createLogContext(this.contextService, "onModuleInit", {
                scriptName,
              }),
              `${scriptName} Lua script loaded successfully`,
            );
            return sha;
          } catch (error) {
            this.logger.warn(
              createErrorContext(this.contextService, "loadLuaScript", error, {
                scriptName,
              }),
              `Failed to load ${scriptName} Lua script - will retry when Redis is available`,
            );
            return null;
          }
        };

        // Load all scripts, but don't fail if any fail
        this.transitionStateScriptSha = await loadScript(
          "transition-state.lua",
        );
        this.createPaymentIntentScriptSha = await loadScript(
          "create-payment-intent.lua",
        );
        this.createOrderFromPaymentScriptSha = await loadScript(
          "create-order-from-payment.lua",
        );
      })();

      // Add overall timeout for entire initialization (5 seconds total)
      await Promise.race([
        initPromise,
        new Promise<void>((_, reject) =>
          setTimeout(
            () => reject(new Error("CheckoutStore init timeout")),
            5000,
          ),
        ),
      ]);
    } catch (error) {
      this.logger.warn(
        createErrorContext(this.contextService, "redisInit", error),
        "Redis client not available during initialization - will retry when Redis is available",
      );
      // Don't throw - allow app to start without Redis
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
        this.logger.debug(
          createLogContext(this.contextService, "acquireCheckoutLock", {
            cartId,
          }),
          "Checkout lock acquired",
        );
        return true;
      }
      this.logger.debug(
        createLogContext(this.contextService, "acquireCheckoutLock", {
          cartId,
        }),
        "Checkout lock already exists",
      );
      return false;
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "acquireCheckoutLock", error, {
          cartId,
        }),
        "Failed to acquire checkout lock",
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
      this.logger.debug(
        createLogContext(this.contextService, "releaseCheckoutLock", {
          cartId,
        }),
        "Checkout lock released",
      );
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "releaseCheckoutLock", error, {
          cartId,
        }),
        "Failed to release checkout lock",
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
   * Check if there's an active checkout session for a cart
   * This is a helper to detect stale locks
   * Uses SCAN to find sessions, but limits the scan to avoid performance issues
   */
  async hasActiveCheckoutSession(cartId: string): Promise<boolean> {
    try {
      // Scan for checkout sessions with this cartId
      // Limit scan to first 1000 keys to avoid performance issues
      const pattern = KEY_PATTERNS.CHECKOUT_SESSION("*");
      let cursor = "0";
      let scannedCount = 0;
      const maxScan = 1000; // Limit scan to prevent performance issues

      do {
        const result = await this.client.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = result[0] as string;
        const foundKeys = result[1] as string[];
        scannedCount += foundKeys.length;

        // Check each session to see if it belongs to this cart
        for (const key of foundKeys) {
          const session = await this.get<CheckoutSession>(key);
          if (
            session &&
            session.cartId === cartId &&
            session.state !== CheckoutState.FAILED &&
            session.state !== CheckoutState.ORDER_CREATED &&
            session.state !== CheckoutState.COMPLETED
          ) {
            // Found an active session for this cart
            return true;
          }
        }

        // Stop if we've scanned enough keys
        if (scannedCount >= maxScan) {
          this.logger.warn(
            `Reached scan limit (${maxScan}) while checking for active checkout session for cartId=${cartId}`,
          );
          break;
        }
      } while (cursor !== "0");

      return false;
    } catch (error) {
      this.logger.error(
        `Failed to check for active checkout session for cartId=${cartId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      // On error, assume no active session (fail open) to allow checkout to proceed
      return false;
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
          // Try multiple times with increasing delays
          const maxRetries = 10;
          const initialDelay = 200;
          this.logger.debug(
            `Waiting for payment intent placeholder to be filled by another process for checkoutSessionId=${checkoutSessionId}, maxRetries=${maxRetries}`,
          );
          console.log(
            `[CheckoutStore] Waiting for placeholder to be filled for checkoutSessionId=${checkoutSessionId}`,
          );

          for (let i = 0; i < maxRetries; i++) {
            const delay = initialDelay * (i + 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
            const retryExisting =
              await this.getPaymentIntent(checkoutSessionId);

            if (retryExisting && retryExisting.paymentIntentId !== "") {
              this.logger.debug(
                `Payment intent placeholder filled after ${i + 1} retries for checkoutSessionId=${checkoutSessionId}, paymentIntentId=${retryExisting.paymentIntentId}`,
              );
              console.log(
                `[CheckoutStore] Placeholder filled after ${i + 1} retries for checkoutSessionId=${checkoutSessionId}`,
              );
              return retryExisting;
            }

            // Log progress every few retries
            if ((i + 1) % 3 === 0) {
              this.logger.debug(
                `Still waiting for placeholder to be filled for checkoutSessionId=${checkoutSessionId}, retry ${i + 1}/${maxRetries}`,
              );
            }
          }

          // If still placeholder after all retries, the provider call likely failed
          // Don't return placeholder - throw error instead
          const totalWaitTime =
            (initialDelay * maxRetries * (maxRetries + 1)) / 2;
          const errorMessage = `Payment intent placeholder was not filled after ${maxRetries} retries (total wait time: ${totalWaitTime}ms) for checkoutSessionId=${checkoutSessionId}. Provider call likely failed or timed out.`;
          this.logger.error(errorMessage);
          console.error(`[CheckoutStore] ${errorMessage}`);
          throw new Error(
            `Payment intent creation timed out - another process created a placeholder but it was never filled after ${maxRetries} retries. This usually indicates the payment provider call failed or timed out. CheckoutSessionId: ${checkoutSessionId}`,
          );
        }

        return existingIntent;
      } else if (status === "ok" && action === "CREATED") {
        // Successfully created placeholder atomically - this process owns the creation
        // Now call provider to create actual payment intent
        // Wrap createFn() with timeout to ensure placeholder cleanup on timeout
        const PROVIDER_TIMEOUT_MS = 15000; // 15 seconds (slightly longer than Razorpay timeout)
        let paymentIntent: PaymentIntent;
        let timeoutId: NodeJS.Timeout | null = null;
        let placeholderCleanedUp = false;

        const cleanupPlaceholder = async () => {
          if (placeholderCleanedUp) return;
          placeholderCleanedUp = true;
          try {
            this.logger.warn(
              `Cleaning up placeholder for checkoutSessionId=${checkoutSessionId}`,
            );
            await this.delete(intentKey);
            await this.delete(tempReverseKey);
            console.log(
              `[CheckoutStore] Placeholder cleaned up for checkoutSessionId=${checkoutSessionId}`,
            );
          } catch (deleteError) {
            console.error(
              `[CheckoutStore] Failed to delete placeholder:`,
              deleteError instanceof Error
                ? deleteError.message
                : "Unknown error",
            );
            this.logger.error(
              `Failed to delete placeholder: ${deleteError instanceof Error ? deleteError.message : "Unknown error"}`,
            );
          }
        };

        try {
          console.log(
            `[CheckoutStore] Lua script path: About to call createFn() for checkoutSessionId=${checkoutSessionId}`,
          );
          this.logger.debug(
            `Calling payment provider for checkoutSessionId=${checkoutSessionId} with timeout=${PROVIDER_TIMEOUT_MS}ms`,
          );

          // Wrap createFn() with timeout to prevent hanging
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              const timeoutError = new Error(
                `Payment provider call timed out after ${PROVIDER_TIMEOUT_MS}ms for checkoutSessionId=${checkoutSessionId}`,
              );
              timeoutError.name = "ProviderTimeoutError";
              this.logger.error(
                `Payment provider call timed out for checkoutSessionId=${checkoutSessionId}`,
              );
              console.error(
                `[CheckoutStore] Payment provider call timed out after ${PROVIDER_TIMEOUT_MS}ms`,
              );
              reject(timeoutError);
            }, PROVIDER_TIMEOUT_MS);
          });

          // Race between provider call and timeout
          try {
            paymentIntent = await Promise.race([createFn(), timeoutPromise]);
          } finally {
            // Always clear timeout if it hasn't fired
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
          }

          console.log(
            `[CheckoutStore] Lua script path: createFn() completed, paymentIntentId=${paymentIntent.paymentIntentId}`,
          );
          this.logger.debug(
            `Payment provider call succeeded for checkoutSessionId=${checkoutSessionId}, paymentIntentId=${paymentIntent.paymentIntentId}`,
          );
        } catch (error) {
          // Provider call failed - delete placeholder, allow retry
          // Log error with both structured logger and console as fallback
          const errorDetails =
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                }
              : { type: typeof error, value: String(error) };

          // Determine if this is a timeout error
          const isTimeoutError =
            error instanceof Error &&
            (error.name === "ProviderTimeoutError" ||
              error.name === "TimeoutError" ||
              error.message.includes("timed out"));

          // Use console.error as fallback to ensure error is visible
          console.error(
            `[CheckoutStore] Payment provider call failed for checkoutSessionId=${checkoutSessionId}:`,
            errorDetails,
            { isTimeoutError },
          );

          this.logger.error(
            {
              checkoutSessionId,
              error: errorDetails,
              isTimeoutError,
            },
            `Payment provider call failed for checkoutSessionId=${checkoutSessionId}${isTimeoutError ? " (timeout)" : ""}`,
          );

          // Always cleanup placeholder on error
          await cleanupPlaceholder();

          // Re-throw error to propagate it
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
      // Wrap createFn() with timeout to ensure placeholder cleanup on timeout
      const PROVIDER_TIMEOUT_MS = 15000; // 15 seconds (slightly longer than Razorpay timeout)
      let timeoutId: NodeJS.Timeout | null = null;
      let placeholderCleanedUp = false;

      const cleanupPlaceholder = async () => {
        if (placeholderCleanedUp) return;
        placeholderCleanedUp = true;
        try {
          this.logger.warn(
            `[Fallback] Cleaning up placeholder for checkoutSessionId=${checkoutSessionId}`,
          );
          await this.delete(intentKey);
          console.log(
            `[CheckoutStore] Fallback path: Placeholder cleaned up for checkoutSessionId=${checkoutSessionId}`,
          );
        } catch (deleteError) {
          console.error(
            `[CheckoutStore] Fallback path: Failed to delete placeholder:`,
            deleteError instanceof Error
              ? deleteError.message
              : "Unknown error",
          );
          this.logger.error(
            `Failed to delete placeholder in fallback path: ${deleteError instanceof Error ? deleteError.message : "Unknown error"}`,
          );
        }
      };

      try {
        console.log(
          `[CheckoutStore] Fallback path: Calling provider for checkoutSessionId=${checkoutSessionId}`,
        );
        console.log(
          `[CheckoutStore] Fallback path: About to call createFn() - this should trigger Razorpay API call`,
        );
        this.logger.debug(
          `[Fallback] Calling payment provider for checkoutSessionId=${checkoutSessionId} with timeout=${PROVIDER_TIMEOUT_MS}ms`,
        );

        // Wrap createFn() with timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            const timeoutError = new Error(
              `Payment provider call timed out after ${PROVIDER_TIMEOUT_MS}ms for checkoutSessionId=${checkoutSessionId}`,
            );
            timeoutError.name = "ProviderTimeoutError";
            this.logger.error(
              `[Fallback] Payment provider call timed out for checkoutSessionId=${checkoutSessionId}`,
            );
            console.error(
              `[CheckoutStore] Fallback path: Payment provider call timed out after ${PROVIDER_TIMEOUT_MS}ms`,
            );
            reject(timeoutError);
          }, PROVIDER_TIMEOUT_MS);
        });

        // Race between provider call and timeout
        let paymentIntent: PaymentIntent;
        try {
          paymentIntent = await Promise.race([createFn(), timeoutPromise]);
        } finally {
          // Always clear timeout if it hasn't fired
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
        }

        console.log(
          `[CheckoutStore] Fallback path: createFn() completed, paymentIntentId=${paymentIntent.paymentIntentId}`,
        );
        this.logger.debug(
          `[Fallback] Payment provider call succeeded for checkoutSessionId=${checkoutSessionId}, paymentIntentId=${paymentIntent.paymentIntentId}`,
        );

        const updatedIntent: PaymentIntent = {
          ...paymentIntent,
          updatedAt: new Date().toISOString(),
        };
        const reverseLookupKey = this.getPaymentIntentReverseKey(
          paymentIntent.paymentIntentId,
        );
        await this.set(intentKey, updatedIntent, TTL.PAYMENT_INTENT);
        await this.set(reverseLookupKey, checkoutSessionId, TTL.PAYMENT_INTENT);
        console.log(
          `[CheckoutStore] Fallback path: Payment intent created successfully: ${paymentIntent.paymentIntentId}`,
        );
        return updatedIntent;
      } catch (providerError) {
        // Provider failed, delete placeholder
        const errorDetails =
          providerError instanceof Error
            ? {
                name: providerError.name,
                message: providerError.message,
                stack: providerError.stack,
              }
            : { type: typeof providerError, value: String(providerError) };

        const isTimeoutError =
          providerError instanceof Error &&
          (providerError.name === "ProviderTimeoutError" ||
            providerError.name === "TimeoutError" ||
            providerError.message.includes("timed out"));

        console.error(
          `[CheckoutStore] Fallback path: Provider call failed for checkoutSessionId=${checkoutSessionId}:`,
          errorDetails,
          { isTimeoutError },
        );

        this.logger.error(
          {
            checkoutSessionId,
            error: errorDetails,
            isTimeoutError,
          },
          `[Fallback] Payment provider call failed for checkoutSessionId=${checkoutSessionId}${isTimeoutError ? " (timeout)" : ""}`,
        );

        // Always cleanup placeholder on error
        await cleanupPlaceholder();

        // Re-throw error to propagate it
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
        createErrorContext(
          this.contextService,
          "getPaymentIntentByPaymentId",
          error,
          { paymentIntentId },
        ),
        "Failed to get payment intent by paymentIntentId",
      );
      throw error;
    }
  }

  /**
   * Store checkout metadata for order creation
   * Metadata is stored separately from checkout session to preserve order creation data
   */
  private getCheckoutMetadataKey(sessionId: string): string {
    return KEY_PATTERNS.CHECKOUT_METADATA(sessionId);
  }

  async storeCheckoutMetadata(
    sessionId: string,
    metadata: CheckoutMetadata,
  ): Promise<void> {
    const key = this.getCheckoutMetadataKey(sessionId);
    try {
      await this.set(key, metadata, TTL.CHECKOUT_METADATA);
      this.logger.debug(
        createLogContext(this.contextService, "storeCheckoutMetadata", {
          sessionId,
        }),
        "Stored checkout metadata",
      );
    } catch (error) {
      this.logger.error(
        createErrorContext(
          this.contextService,
          "storeCheckoutMetadata",
          error,
          { sessionId },
        ),
        "Failed to store checkout metadata",
      );
      throw error;
    }
  }

  async getCheckoutMetadata(
    sessionId: string,
  ): Promise<CheckoutMetadata | null> {
    const key = this.getCheckoutMetadataKey(sessionId);
    try {
      return await this.get<CheckoutMetadata>(key);
    } catch (error) {
      this.logger.error(
        `Failed to get checkout metadata for sessionId=${sessionId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get order ID by payment intent (payment-scoped idempotency)
   * Returns the order ID if an order was already created for this payment intent
   */
  private getOrderByPaymentKey(
    provider: string,
    paymentIntentId: string,
  ): string {
    return KEY_PATTERNS.ORDER_BY_PAYMENT(provider, paymentIntentId);
  }

  /**
   * Atomically create or get order ID for a payment intent
   * Uses Lua script to ensure atomicity and prevent duplicate orders
   * @param provider - Payment provider (e.g., "razorpay")
   * @param paymentIntentId - Payment intent ID from provider
   * @param orderId - Order ID to store if not exists
   * @returns Existing order ID if found, or the provided orderId if created
   */
  async createOrderFromPayment(
    provider: string,
    paymentIntentId: string,
    orderId: string,
  ): Promise<string> {
    if (!this.createOrderFromPaymentScriptSha) {
      throw new Error(
        "Order creation from payment Lua script not loaded. Check Redis connection and script file.",
      );
    }

    const orderKey = this.getOrderByPaymentKey(provider, paymentIntentId);

    try {
      const result = (await this.client.evalsha(
        this.createOrderFromPaymentScriptSha,
        1, // Number of keys
        orderKey,
        orderId,
        TTL.ORDER_BY_PAYMENT.toString(),
      )) as [string, string, string];

      const [status, action, existingOrderId] = result;

      if (status === "ok" && action === "EXISTS") {
        // Order already exists for this payment intent
        this.logger.debug(
          `Order already exists for paymentIntentId=${paymentIntentId}, orderId=${existingOrderId}`,
        );
        return existingOrderId;
      } else if (status === "ok" && action === "CREATED") {
        // Successfully created mapping
        this.logger.debug(
          `Created order mapping for paymentIntentId=${paymentIntentId}, orderId=${orderId}`,
        );
        return orderId;
      } else {
        throw new Error(`Failed to create order from payment: ${action}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to create order from payment for paymentIntentId=${paymentIntentId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get order ID by payment intent ID (reverse lookup)
   * @param provider - Payment provider (e.g., "razorpay")
   * @param paymentIntentId - Payment intent ID from provider
   * @returns Order ID or null if not found
   */
  async getOrderByPaymentIntent(
    provider: string,
    paymentIntentId: string,
  ): Promise<string | null> {
    const orderKey = this.getOrderByPaymentKey(provider, paymentIntentId);
    try {
      return await this.get<string>(orderKey);
    } catch (error) {
      this.logger.error(
        `Failed to get order by paymentIntentId=${paymentIntentId}: ${error instanceof Error ? error.message : "Unknown error"}`,
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

    // Strict validation: ORDER_CREATED can only occur from PAYMENT_CONFIRMED
    if (
      to === CheckoutState.ORDER_CREATED &&
      from !== CheckoutState.PAYMENT_CONFIRMED
    ) {
      throw new BadRequestException(
        `Invalid state transition: Cannot transition to ORDER_CREATED from ${from}. ORDER_CREATED can only occur after PAYMENT_CONFIRMED.`,
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
      // Check if this is a script error that requires reloading
      if (
        error instanceof Error &&
        (error.message.includes("require") ||
          error.message.includes("user_script") ||
          error.message.includes("NOSCRIPT"))
      ) {
        this.logger.warn(
          createLogContext(this.contextService, "transitionState", {
            sessionId,
            error: error.message,
          }),
          "Detected script error, reloading transition state script and retrying",
        );
        try {
          // Reload the script
          await this.reloadTransitionStateScript();
          // Retry the operation
          if (!this.transitionStateScriptSha) {
            throw new Error("Failed to reload transition state script");
          }
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
            throw new BadRequestException(
              `State transition failed: ${errorType}`,
            );
          }

          this.logger.debug(
            `State transition successful after script reload: sessionId=${sessionId}, ${from} → ${to}`,
          );
          return;
        } catch (retryError) {
          // If retry also fails, log and throw original error
          this.logger.error(
            createErrorContext(
              this.contextService,
              "transitionState",
              retryError,
              { sessionId },
            ),
            "Failed to transition state after script reload",
          );
          throw retryError;
        }
      }

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
   * Get checkout session by cart ID
   * Scans for sessions with matching cartId
   * Returns the first active session found
   */
  async getSessionByCartId(
    cartId: string,
  ): Promise<{ sessionId: string; session: CheckoutSession } | null> {
    try {
      // Scan for checkout sessions with this cartId
      const pattern = KEY_PATTERNS.CHECKOUT_SESSION("*");
      let cursor = "0";
      let scannedCount = 0;
      const maxScan = 1000; // Limit scan to prevent performance issues

      do {
        const result = await this.client.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = result[0] as string;
        const foundKeys = result[1] as string[];
        scannedCount += foundKeys.length;

        // Check each session to see if it belongs to this cart
        for (const key of foundKeys) {
          const session = await this.get<CheckoutSession>(key);
          if (
            session &&
            session.cartId === cartId &&
            session.state !== CheckoutState.FAILED &&
            session.state !== CheckoutState.COMPLETED
          ) {
            // Extract sessionId from key (format: checkout:session:{sessionId})
            const sessionId = key.replace(
              KEY_PATTERNS.CHECKOUT_SESSION(""),
              "",
            );
            return { sessionId, session };
          }
        }

        // Stop if we've scanned enough keys
        if (scannedCount >= maxScan) {
          this.logger.warn(
            `Reached scan limit (${maxScan}) while looking for checkout session for cartId=${cartId}`,
          );
          break;
        }
      } while (cursor !== "0");

      return null;
    } catch (error) {
      this.logger.error(
        `Failed to get checkout session by cartId=${cartId}: ${error instanceof Error ? error.message : "Unknown error"}`,
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
