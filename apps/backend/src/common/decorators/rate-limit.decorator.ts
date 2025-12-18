import { SetMetadata } from "@nestjs/common";
import { RateLimitConfig } from "../rate-limiting/rate-limit.config";

export const RATE_LIMIT_KEY = "rateLimit";

/**
 * Decorator to mark endpoints with rate limit configuration
 * @param config Rate limit configuration
 * @example
 * @RateLimit({ limit: 1000, window: 300, keyType: 'ip' })
 * @Get()
 * async getProducts() { ... }
 */
export const RateLimit = (config: RateLimitConfig) =>
  SetMetadata(RATE_LIMIT_KEY, config);
