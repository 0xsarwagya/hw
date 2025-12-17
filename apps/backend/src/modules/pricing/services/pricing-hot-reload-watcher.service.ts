import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import Redis from "ioredis";
import { RedisStoreService } from "../../redis-store/redis-store.service";
import { PricingBundle, PricingBundleService } from "./pricing-bundle.service";
import { PricingVersionManager } from "./pricing-version-manager.service";

/**
 * Service for watching pricing ruleset version changes and maintaining in-memory cache
 * Provides ultra-fast bundle access (memory vs Redis)
 */
@Injectable()
export class PricingHotReloadWatcher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PricingHotReloadWatcher.name);
  private readonly subscriber: Redis;

  // In-memory cache
  private currentBundle: PricingBundle | null = null;
  private currentVersion = 0;

  constructor(
    readonly redisStoreService: RedisStoreService,
    private readonly versionManager: PricingVersionManager,
    private readonly bundleService: PricingBundleService,
  ) {
    // Create separate subscriber client (required for pub/sub)
    this.subscriber = redisStoreService.getClient().duplicate();
  }

  /**
   * Initialize watcher on module startup
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.refreshBundle(); // Initial load
      await this.subscribeToVersionChanges();
      this.logger.log(
        `Pricing hot reload watcher initialized (v${this.currentVersion})`,
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
      this.logger.log("Pricing hot reload watcher stopped");
    } catch (error) {
      this.logger.error(
        `Error stopping pricing hot reload watcher: ${error instanceof Error ? error.message : "Unknown error"}`,
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
        this.logger.log(
          `In-memory pricing bundle refreshed to v${version} in ${Date.now() - startTime}ms`,
        );
      } else {
        this.logger.error(
          `Failed to refresh in-memory bundle: Invalid or missing bundle for version ${version}`,
        );
        // Keep old bundle if new one is invalid
      }
    } catch (error) {
      this.logger.error(
        `Error refreshing in-memory pricing bundle: ${error instanceof Error ? error.message : "Unknown error"}`,
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
          `Failed to subscribe to Redis channel ${channel}: ${err.message}`,
        );
        return;
      }
      this.logger.log(`Subscribed to Redis channel: ${channel}`);
    });

    this.subscriber.on("message", (channelName, message) => {
      if (channelName === channel) {
        try {
          const { version: newVersion } = JSON.parse(message);
          if (newVersion > this.currentVersion) {
            this.logger.log(
              `Detected new pricing ruleset version ${newVersion}. Triggering hot reload...`,
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
