import { Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import { createLogContext } from "../../../common/logging/logging.helper";
import { BundleResponseDto } from "../../bundles/dto/bundle-response.dto";
import { BundleSetResponseDto } from "../../bundles/dto/bundle-set-response.dto";
import { KEY_PATTERNS, TTL } from "../constants/key-patterns";
import { IBundleCacheStore } from "../interfaces/redis-store.interface";
import { RedisStoreService } from "../redis-store.service";

@Injectable()
export class BundleCacheStore implements IBundleCacheStore, OnModuleInit {
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
   * Store bundle definition (full bundle with sets and items)
   */
  async storeBundleDefinition(
    bundleId: string,
    bundle: BundleResponseDto,
  ): Promise<void> {
    const key = KEY_PATTERNS.BUNDLE_DEFINITION(bundleId);
    try {
      await this.set(key, bundle, TTL.BUNDLE_DEFINITION);
      this.logger.debug(
        createLogContext(this.contextService, "storeBundleDefinition", {
          bundleId,
        }),
        "Stored bundle definition",
      );
    } catch (error) {
      this.logger.error(
        `Failed to store bundle definition for bundle ${bundleId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get bundle definition from cache
   */
  async getBundleDefinition(
    bundleId: string,
  ): Promise<BundleResponseDto | null> {
    const key = KEY_PATTERNS.BUNDLE_DEFINITION(bundleId);
    try {
      return await this.get<BundleResponseDto>(key);
    } catch (error) {
      this.logger.error(
        `Failed to get bundle definition for bundle ${bundleId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null; // Return null on error to allow fallback
    }
  }

  /**
   * Store bundle sets metadata
   */
  async storeBundleSets(
    bundleId: string,
    sets: BundleSetResponseDto[],
  ): Promise<void> {
    const key = KEY_PATTERNS.BUNDLE_SETS(bundleId);
    try {
      await this.set(key, sets, TTL.BUNDLE_SETS);
      this.logger.debug(
        `Stored bundle sets for bundle ${bundleId} with ${sets.length} sets`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to store bundle sets for bundle ${bundleId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get bundle sets from cache
   */
  async getBundleSets(
    bundleId: string,
  ): Promise<BundleSetResponseDto[] | null> {
    const key = KEY_PATTERNS.BUNDLE_SETS(bundleId);
    try {
      return await this.get<BundleSetResponseDto[]>(key);
    } catch (error) {
      this.logger.error(
        `Failed to get bundle sets for bundle ${bundleId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null; // Return null on error to allow fallback
    }
  }

  /**
   * Store bundle eligibility (variant IDs allowed in a set)
   */
  async storeBundleEligibility(
    bundleId: string,
    setId: string,
    variantIds: string[],
  ): Promise<void> {
    const key = KEY_PATTERNS.BUNDLE_ELIGIBILITY(bundleId, setId);
    try {
      if (variantIds.length === 0) {
        // Store empty set as empty array
        await this.set(key, [], TTL.BUNDLE_ELIGIBILITY);
        this.logger.debug(
          `Stored empty eligibility set for bundle ${bundleId}, set ${setId}`,
        );
        return;
      }

      // Store as JSON array
      await this.set(key, variantIds, TTL.BUNDLE_ELIGIBILITY);
      this.logger.debug(
        `Stored eligibility set for bundle ${bundleId}, set ${setId} with ${variantIds.length} variants`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to store eligibility for bundle ${bundleId}, set ${setId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get bundle eligibility from cache
   */
  async getBundleEligibility(
    bundleId: string,
    setId: string,
  ): Promise<string[] | null> {
    const key = KEY_PATTERNS.BUNDLE_ELIGIBILITY(bundleId, setId);
    try {
      return await this.get<string[]>(key);
    } catch (error) {
      this.logger.error(
        `Failed to get eligibility for bundle ${bundleId}, set ${setId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return null; // Return null on error to allow fallback
    }
  }

  /**
   * Invalidate all cache entries for a bundle
   */
  async invalidateBundle(bundleId: string): Promise<void> {
    try {
      const keys = [
        KEY_PATTERNS.BUNDLE_DEFINITION(bundleId),
        KEY_PATTERNS.BUNDLE_SETS(bundleId),
        // Note: We can't easily delete all eligibility keys without knowing setIds
        // In Phase 14-2, we might add a pattern-based deletion or track setIds
      ];

      // Delete definition and sets keys
      if (keys.length > 0) {
        await this.client.del(...keys);
        this.logger.debug(
          createLogContext(this.contextService, "invalidateBundle", {
            bundleId,
          }),
          "Invalidated cache for bundle",
        );
      }

      // For eligibility keys, we'd need to know the setIds
      // This is a limitation for Phase 14-1 - will be improved in Phase 14-2
    } catch (error) {
      this.logger.error(
        `Failed to invalidate cache for bundle ${bundleId}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }
}
