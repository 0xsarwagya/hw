import { Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import { createLogContext } from "../../../common/logging/logging.helper";
import { KEY_PATTERNS, TTL } from "../constants/key-patterns";
import { IProductMappingStore } from "../interfaces/redis-store.interface";
import { RedisStoreService } from "../redis-store.service";

export interface ProductMapping {
  collections: string[];
  tags: string[];
  variants: string[];
}

export interface VariantMapping {
  productId: string;
  collections: string[];
  tags: string[];
}

@Injectable()
export class ProductMappingStore implements IProductMappingStore, OnModuleInit {
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
   * Store product mapping (collections, tags, variants)
   */
  async storeProductMapping(
    productId: string,
    mapping: ProductMapping,
  ): Promise<void> {
    const key = KEY_PATTERNS.MAPPING_PRODUCT(productId);
    try {
      await this.set(key, mapping, TTL.PRODUCT_MAPPING);
      this.logger.debug(
        createLogContext(this.contextService, "storeProductMapping", {
          productId,
        }),
        "Stored product mapping",
      );
    } catch (error) {
      this.logger.error(
        `Failed to store product mapping for product ${productId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Store variant mapping (product, collections, tags)
   */
  async storeVariantMapping(
    variantId: string,
    mapping: VariantMapping,
  ): Promise<void> {
    const key = KEY_PATTERNS.MAPPING_VARIANT(variantId);
    try {
      await this.set(key, mapping, TTL.PRODUCT_MAPPING);
      this.logger.debug(
        createLogContext(this.contextService, "storeVariantMapping", {
          variantId,
        }),
        "Stored variant mapping",
      );
    } catch (error) {
      this.logger.error(
        `Failed to store variant mapping for variant ${variantId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get product mapping
   */
  async getProductMapping(productId: string): Promise<ProductMapping | null> {
    const key = KEY_PATTERNS.MAPPING_PRODUCT(productId);
    try {
      return await this.get<ProductMapping>(key);
    } catch (error) {
      this.logger.error(
        `Failed to get product mapping for product ${productId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null;
    }
  }

  /**
   * Get variant mapping
   */
  async getVariantMapping(variantId: string): Promise<VariantMapping | null> {
    const key = KEY_PATTERNS.MAPPING_VARIANT(variantId);
    try {
      return await this.get<VariantMapping>(key);
    } catch (error) {
      this.logger.error(
        `Failed to get variant mapping for variant ${variantId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null;
    }
  }

  /**
   * Invalidate product mapping
   */
  async invalidateProductMapping(productId: string): Promise<void> {
    const key = KEY_PATTERNS.MAPPING_PRODUCT(productId);
    try {
      await this.delete(key);
      this.logger.debug(
        createLogContext(this.contextService, "invalidateProductMapping", {
          productId,
        }),
        "Invalidated product mapping",
      );
    } catch (error) {
      this.logger.error(
        `Failed to invalidate product mapping for product ${productId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Invalidate variant mapping
   */
  async invalidateVariantMapping(variantId: string): Promise<void> {
    const key = KEY_PATTERNS.MAPPING_VARIANT(variantId);
    try {
      await this.delete(key);
      this.logger.debug(
        createLogContext(this.contextService, "invalidateVariantMapping", {
          variantId,
        }),
        "Invalidated variant mapping",
      );
    } catch (error) {
      this.logger.error(
        `Failed to invalidate variant mapping for variant ${variantId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }
}
