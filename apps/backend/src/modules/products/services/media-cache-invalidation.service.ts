import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../../../common/logging/logging.helper";
import { RedisStoreService } from "../../redis-store/redis-store.service";

/**
 * Media Cache Invalidation Service
 * Handles cache invalidation for product and variant images
 */
@Injectable()
export class MediaCacheInvalidationService {
  constructor(
    private readonly redisStore: RedisStoreService,
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
  ) {}

  /**
   * Invalidate product images cache
   */
  async invalidateProductImages(productId: string): Promise<void> {
    try {
      // Invalidate product detail cache (which includes images)
      await this.invalidateProductCache(productId);

      // Invalidate specific product images cache if it exists
      const imageCacheKey = `product:${productId}:images`;
      const client = await this.redisStore.getClient();
      await client.del(imageCacheKey);

      this.logger.debug(
        createLogContext(this.contextService, "invalidateProductImages", {
          productId,
        }),
        "Invalidated product images cache",
      );
    } catch (error) {
      // Don't throw - cache invalidation failures shouldn't break operations
      this.logger.warn(
        createErrorContext(
          this.contextService,
          "invalidateProductImages",
          error,
          { productId },
        ),
        "Failed to invalidate product images cache",
      );
    }
  }

  /**
   * Invalidate variant images cache
   */
  async invalidateVariantImages(
    productId: string,
    variantId: string,
  ): Promise<void> {
    try {
      // Invalidate product cache (variant images are part of product)
      await this.invalidateProductCache(productId);

      // Invalidate specific variant images cache if it exists
      const variantImageCacheKey = `product:${productId}:variant:${variantId}:images`;
      const client = await this.redisStore.getClient();
      await client.del(variantImageCacheKey);

      this.logger.debug(
        createLogContext(this.contextService, "invalidateVariantImages", {
          productId,
          variantId,
        }),
        "Invalidated variant images cache",
      );
    } catch (error) {
      // Don't throw - cache invalidation failures shouldn't break operations
      this.logger.warn(
        createErrorContext(
          this.contextService,
          "invalidateVariantImages",
          error,
          { productId, variantId },
        ),
        "Failed to invalidate variant images cache",
      );
    }
  }

  /**
   * Invalidate product detail cache
   */
  async invalidateProductCache(productId: string): Promise<void> {
    try {
      const productCacheKey = `product:${productId}`;
      const client = await this.redisStore.getClient();
      await client.del(productCacheKey);

      // Also invalidate product list caches (they may include image data)
      // Note: This is a broad invalidation, but ensures consistency
      const _listCachePatterns = [
        "products:list:*",
        "products:search:*",
        "products:filter:*",
      ];

      // Delete matching keys (if Redis supports pattern deletion)
      // For now, we'll just log - full pattern deletion requires scanning
      this.logger.debug(
        createLogContext(this.contextService, "invalidateProductCache", {
          productId,
        }),
        "Invalidated product cache",
      );
    } catch (error) {
      // Don't throw - cache invalidation failures shouldn't break operations
      this.logger.warn(
        createErrorContext(
          this.contextService,
          "invalidateProductCache",
          error,
          { productId },
        ),
        "Failed to invalidate product cache",
      );
    }
  }

  /**
   * Invalidate all media-related caches
   */
  async invalidateAllMediaCaches(): Promise<void> {
    try {
      // This is a broad operation - use with caution
      // For now, we'll just log - full cache clearing requires careful consideration
      this.logger.info(
        createLogContext(this.contextService, "invalidateAllMediaCaches", {}),
        "Requested invalidation of all media caches",
      );
    } catch (error) {
      this.logger.warn(
        createErrorContext(
          this.contextService,
          "invalidateAllMediaCaches",
          error,
        ),
        "Failed to invalidate all media caches",
      );
    }
  }
}
