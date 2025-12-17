import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import Redis from "ioredis";
import { RedisStoreService } from "../../redis-store/redis-store.service";
import { RulesetBundle, RulesetBundleService } from "./ruleset-bundle.service";
import { RulesetVersionManager } from "./ruleset-version-manager.service";

/**
 * Service for watching discount ruleset version changes and maintaining in-memory cache
 * Provides ultra-fast bundle access (memory vs Redis)
 */
@Injectable()
export class HotReloadWatcher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HotReloadWatcher.name);
  private subscriber!: Redis;

  // In-memory cache
  private currentBundle: RulesetBundle | null = null;
  private currentVersion = 0;
  private isInitialized = false;

  private readonly redisStoreService: RedisStoreService;

  constructor(
    redisStoreService: RedisStoreService,
    private readonly versionManager: RulesetVersionManager,
    private readonly bundleService: RulesetBundleService,
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
      // Load initial bundle
      await this.refreshBundle();

      // Subscribe to version changes
      await this.subscribeToVersionChanges();

      this.isInitialized = true;
      this.logger.log(
        `Hot reload watcher initialized (version ${this.currentVersion})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize hot reload watcher: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      // Don't throw - allow fallback to Redis reads
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
      this.logger.log("Hot reload watcher destroyed");
    } catch (error) {
      this.logger.error(
        `Error destroying hot reload watcher: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get current bundle from in-memory cache
   */
  getCurrentBundle(): RulesetBundle | null {
    if (!this.isInitialized || !this.currentBundle) {
      return null;
    }
    return this.currentBundle;
  }

  /**
   * Get current version from in-memory cache
   */
  getCurrentVersion(): number {
    return this.currentVersion;
  }

  /**
   * Refresh bundle from Redis (manual refresh)
   */
  async refreshBundle(): Promise<void> {
    try {
      const version = await this.versionManager.getCurrentVersion();
      const bundle = await this.bundleService.getBundle(version);

      if (!bundle) {
        this.logger.warn(
          `Bundle not found for version ${version}, attempting to load current bundle`,
        );
        const currentBundle = await this.bundleService.getCurrentBundle();
        if (currentBundle) {
          this.currentBundle = currentBundle;
          this.currentVersion = currentBundle.version;
          this.logger.log(
            `Loaded bundle v${this.currentVersion} into memory cache`,
          );
        } else {
          this.logger.warn("No bundle available, cache will be empty");
        }
        return;
      }

      // Validate bundle before caching
      if (this.validateBundle(bundle)) {
        this.currentBundle = bundle;
        this.currentVersion = version;
        this.logger.debug(
          `Refreshed bundle v${this.currentVersion} in memory cache`,
        );
      } else {
        this.logger.error(`Invalid bundle v${version}, not caching`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to refresh bundle: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      // Don't throw - allow fallback to Redis reads
    }
  }

  /**
   * Subscribe to Redis pub/sub for version changes
   */
  private async subscribeToVersionChanges(): Promise<void> {
    const channel = this.versionManager.getVersionChannel();

    this.subscriber.on("message", async (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const data = JSON.parse(message) as {
            version: number;
            timestamp: string;
          };
          this.logger.log(
            `Received version change notification: v${data.version}`,
          );

          // Refresh bundle from Redis
          await this.refreshBundle();
        } catch (error) {
          this.logger.error(
            `Failed to process version change notification: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    });

    await this.subscriber.subscribe(channel);
    this.logger.debug(`Subscribed to version change channel: ${channel}`);
  }

  /**
   * Validate bundle integrity before caching
   */
  private validateBundle(bundle: RulesetBundle): boolean {
    if (!bundle || !bundle.rules || !bundle.metadata) {
      return false;
    }

    if (bundle.version !== bundle.metadata.version) {
      this.logger.error(
        `Bundle version mismatch: ${bundle.version} vs ${bundle.metadata.version}`,
      );
      return false;
    }

    if (bundle.rules.length !== bundle.metadata.rulesCount) {
      this.logger.error(
        `Bundle rules count mismatch: ${bundle.rules.length} vs ${bundle.metadata.rulesCount}`,
      );
      return false;
    }

    return true;
  }
}
