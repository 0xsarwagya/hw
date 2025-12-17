import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../../../common/logging/logging.helper";
import { RedisStoreService } from "../../redis-store/redis-store.service";
import { PricingBundle, PricingBundleService } from "./pricing-bundle.service";
import { PricingVersionManager } from "./pricing-version-manager.service";

/**
 * Service for watching pricing ruleset version changes and maintaining in-memory cache
 * Provides ultra-fast bundle access (memory vs Redis)
 */
@Injectable()
export class PricingHotReloadWatcher implements OnModuleInit, OnModuleDestroy {
  private subscriber!: Redis;
  private readonly redisStoreService: RedisStoreService;

  // In-memory cache
  private currentBundle: PricingBundle | null = null;
  private currentVersion = 0;

  constructor(
    redisStoreService: RedisStoreService,
    private readonly versionManager: PricingVersionManager,
    private readonly bundleService: PricingBundleService,
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
  ) {
    this.redisStoreService = redisStoreService;
  }

  /**
   * Initialize watcher on module startup
   */
  async onModuleInit(): Promise<void> {
    // Create separate subscriber client (required for pub/sub)
    // Disable ready check to avoid conflicts with subscriber mode
    this.subscriber = this.redisStoreService.getClient().duplicate({
      enableReadyCheck: false,
      enableOfflineQueue: false,
    });
    try {
      await this.refreshBundle(); // Initial load
      await this.subscribeToVersionChanges();
      this.logger.info(
        createLogContext(this.contextService, "onModuleInit", {
          version: this.currentVersion,
        }),
        "Pricing hot reload watcher initialized",
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize pricing hot reload watcher: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.subscriber.unsubscribe(
        this.versionManager.getVersionChannel(),
      );
      await this.subscriber.quit();
      this.logger.info(
        createLogContext(this.contextService, "onModuleDestroy", {}),
        "Pricing hot reload watcher stopped",
      );
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "onModuleDestroy", error),
        "Error stopping pricing hot reload watcher",
      );
    }
  }

  /**
   * Get current active bundle from in-memory cache
   */
  getCurrentBundle(): PricingBundle | null {
    return this.currentBundle;
  }

  /**
   * Get current active ruleset version
   */
  getCurrentVersion(): number {
    return this.currentVersion;
  }

  /**
   * Manually refresh the in-memory bundle from Redis
   */
  async refreshBundle(): Promise<void> {
    const startTime = Date.now();
    try {
      const version = await this.versionManager.getCurrentVersion();
      const bundle = await this.bundleService.getBundle(version);

      if (bundle && this.bundleService.validateBundle(bundle)) {
        this.currentBundle = bundle;
        this.currentVersion = version;
        this.logger.info(
          createLogContext(this.contextService, "refreshBundle", {
            version,
            refreshTimeMs: Date.now() - startTime,
          }),
          "In-memory pricing bundle refreshed",
        );
      } else {
        this.logger.error(
          createLogContext(this.contextService, "refreshBundle", { version }),
          "Failed to refresh in-memory bundle: Invalid or missing bundle",
        );
        // Keep old bundle if new one is invalid
      }
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "refreshBundle", error),
        "Error refreshing in-memory pricing bundle",
      );
      // Keep old bundle if refresh fails
    }
  }

  /**
   * Subscribe to Redis Pub/Sub for version change notifications
   */
  private async subscribeToVersionChanges(): Promise<void> {
    const channel = this.versionManager.getVersionChannel();

    this.subscriber.subscribe(channel, (err) => {
      if (err) {
        this.logger.error(
          createErrorContext(
            this.contextService,
            "subscribeToVersionChanges",
            err,
            { channel },
          ),
          "Failed to subscribe to Redis channel",
        );
        return;
      }
      this.logger.info(
        createLogContext(this.contextService, "subscribeToVersionChanges", {
          channel,
        }),
        "Subscribed to Redis channel",
      );
    });

    this.subscriber.on("message", (channelName, message) => {
      if (channelName === channel) {
        try {
          const { version: newVersion } = JSON.parse(message);
          if (newVersion > this.currentVersion) {
            this.logger.info(
              createLogContext(
                this.contextService,
                "subscribeToVersionChanges",
                { version: newVersion },
              ),
              "Detected new pricing ruleset version, triggering hot reload",
            );
            this.refreshBundle(); // Refresh in background
          }
        } catch (error) {
          this.logger.error(
            `Failed to parse Redis message: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    });
  }
}
