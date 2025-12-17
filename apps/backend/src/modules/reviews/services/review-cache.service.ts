import { Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../../../common/logging/logging.helper";
import { RedisStoreService } from "../../redis-store/redis-store.service";
import { ReviewAggregateDto } from "../dto/review-aggregate.dto";
import { ReviewQueryDto } from "../dto/review-query.dto";
import { ReviewResponseDto } from "../dto/review-response.dto";

/**
 * Redis key patterns for reviews
 */
const KEY_PATTERNS = {
  REVIEWS: (variantId: string, queryHash: string) =>
    `product_reviews:${variantId}:${queryHash}`,
  AGGREGATE: (variantId: string) => `product_review_agg:${variantId}`,
} as const;

/**
 * Cache TTL (no expiration for reviews - persistent cache)
 */
const CACHE_TTL = 0; // No expiration

@Injectable()
export class ReviewCacheService implements OnModuleInit {
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
    this.client = this.redisStoreService.getClient();
  }

  /**
   * Generate hash for query parameters (for cache key)
   */
  private hashQuery(query: ReviewQueryDto): string {
    const parts = [
      `page:${query.page || 1}`,
      `limit:${query.limit || 20}`,
      `sort:${query.sort || "newest"}`,
      query.minRating ? `minRating:${query.minRating}` : "",
      query.imagesOnly ? "imagesOnly:true" : "",
    ].filter(Boolean);
    return parts.join(":");
  }

  /**
   * Get reviews from cache
   */
  async getReviews(
    variantId: string,
    query: ReviewQueryDto,
  ): Promise<{
    data: ReviewResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null> {
    try {
      const queryHash = this.hashQuery(query);
      const key = KEY_PATTERNS.REVIEWS(variantId, queryHash);
      const cached = await this.client.get(key);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      this.logger.warn(
        createErrorContext(this.contextService, "getReviews", error, {
          variantId,
        }),
        "Failed to get reviews from cache",
      );
      return null;
    }
  }

  /**
   * Set reviews in cache
   */
  async setReviews(
    variantId: string,
    query: ReviewQueryDto,
    data: {
      data: ReviewResponseDto[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    },
  ): Promise<void> {
    try {
      const queryHash = this.hashQuery(query);
      const key = KEY_PATTERNS.REVIEWS(variantId, queryHash);
      await this.client.set(key, JSON.stringify(data));

      if (CACHE_TTL > 0) {
        await this.client.expire(key, CACHE_TTL);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to set reviews in cache: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get aggregate from cache
   */
  async getAggregate(variantId: string): Promise<ReviewAggregateDto | null> {
    try {
      const key = KEY_PATTERNS.AGGREGATE(variantId);
      const cached = await this.client.get(key);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      this.logger.warn(
        `Failed to get aggregate from cache: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null;
    }
  }

  /**
   * Set aggregate in cache
   */
  async setAggregate(
    variantId: string,
    aggregate: ReviewAggregateDto,
  ): Promise<void> {
    try {
      const key = KEY_PATTERNS.AGGREGATE(variantId);
      await this.client.set(key, JSON.stringify(aggregate));

      if (CACHE_TTL > 0) {
        await this.client.expire(key, CACHE_TTL);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to set aggregate in cache: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Invalidate all cache entries for a variant
   */
  async invalidateVariant(variantId: string): Promise<void> {
    try {
      // Delete aggregate
      const aggregateKey = KEY_PATTERNS.AGGREGATE(variantId);
      await this.client.del(aggregateKey);

      // Delete all review query caches (pattern match)
      const pattern = KEY_PATTERNS.REVIEWS(variantId, "*");
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }

      this.logger.debug(
        createLogContext(this.contextService, "invalidateVariant", {
          variantId,
        }),
        "Invalidated cache for variant",
      );
    } catch (error) {
      this.logger.warn(
        createErrorContext(this.contextService, "invalidateVariant", error, {
          variantId,
        }),
        "Failed to invalidate cache for variant",
      );
    }
  }
}
