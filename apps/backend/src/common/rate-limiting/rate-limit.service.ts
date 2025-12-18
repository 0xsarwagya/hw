import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { RedisStoreService } from "../../modules/redis-store/redis-store.service";
import { ContextService } from "../logging/context.service";
import { createErrorContext } from "../logging/logging.helper";
import { ExtendedRequest } from "../logging/types";
import { RateLimitConfig, RateLimitKeyType } from "./rate-limit.config";

export interface RateLimitState {
  count: number;
  limit: number;
  remaining: number;
  resetTime: number; // Unix timestamp in seconds
  ttl: number; // Time to live in seconds
}

@Injectable()
export class RateLimitService {
  private readonly keyPrefix = "ratelimit:";

  constructor(
    private readonly redisStoreService: RedisStoreService,
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
  ) {}

  /**
   * Check and increment rate limit counter
   * @param config Rate limit configuration
   * @param identifier Unique identifier based on keyType (IP, sessionId, userId, etc.)
   * @returns Rate limit state
   */
  async checkRateLimit(
    config: RateLimitConfig,
    identifier: string,
  ): Promise<RateLimitState> {
    const key = this.generateKey(config.keyType, identifier);
    const now = Math.floor(Date.now() / 1000);
    const resetTime = now + config.window;

    try {
      const client = await this.redisStoreService.getClient();
      const execResult = await client
        .multi()
        .incr(key)
        .expire(key, config.window)
        .ttl(key)
        .exec();

      if (!execResult) {
        throw new Error("Redis transaction failed");
      }

      const count = (execResult[0]?.[1] as number) || 0;
      const ttl = (execResult[2]?.[1] as number) || config.window;

      const remaining = Math.max(0, config.limit - count);
      const state: RateLimitState = {
        count,
        limit: config.limit,
        remaining,
        resetTime,
        ttl,
      };

      return state;
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "rateLimitCheck", error, {
          key,
          config,
          identifier,
        }),
        "Error checking rate limit",
      );
      throw error;
    }
  }

  /**
   * Generate Redis key based on key type and identifier
   */
  private generateKey(keyType: RateLimitKeyType, identifier: string): string {
    return `${this.keyPrefix}${keyType}:${identifier}`;
  }

  /**
   * Extract identifier from request based on key type
   */
  extractIdentifier(
    keyType: RateLimitKeyType,
    request: ExtendedRequest,
    email?: string,
  ): string {
    switch (keyType) {
      case "ip":
        return this.extractIpAddress(request);
      case "sessionId": {
        const sessionId = request.headers["x-session-id"];
        if (typeof sessionId === "string") {
          return sessionId;
        }
        if (Array.isArray(sessionId) && sessionId.length > 0) {
          return sessionId[0];
        }
        return "unknown";
      }
      case "userId":
        return request.user?.id || "unknown";
      case "ip+email": {
        if (!email) {
          throw new Error("Email required for ip+email key type");
        }
        const ip = this.extractIpAddress(request);
        // Normalize email to lowercase for consistent hashing
        return `${ip}:${email.toLowerCase()}`;
      }
      default:
        return "unknown";
    }
  }

  /**
   * Extract IP address from request
   */
  private extractIpAddress(request: ExtendedRequest): string {
    const forwardedFor = request.headers["x-forwarded-for"] as string;
    if (forwardedFor) {
      // Take the first IP in the chain (original client)
      return forwardedFor.split(",")[0].trim();
    }

    const realIp = request.headers["x-real-ip"] as string;
    if (realIp) {
      return realIp.trim();
    }

    return request.socket?.remoteAddress || "unknown";
  }

  /**
   * Extract email from request body (for ip+email key type)
   */
  extractEmail(request: ExtendedRequest): string | undefined {
    return request.body?.email || request.body?.emailAddress;
  }
}
