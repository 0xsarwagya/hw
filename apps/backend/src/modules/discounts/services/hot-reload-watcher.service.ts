import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../../../common/logging/logging.helper";
import { RedisStoreService } from "../../redis-store/redis-store.service";
import { RulesetBundle, RulesetBundleService } from "./ruleset-bundle.service";
import { RulesetVersionManager } from "./ruleset-version-manager.service";

/**
 * Service for watching discount ruleset version changes and maintaining in-memory cache
 * Provides ultra-fast bundle access (memory vs Redis)
 */
@Injectable()
export class HotReloadWatcher implements OnModuleInit, OnModuleDestroy {
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
      // Load initial bundle
      await this.refreshBundle();

      // Subscribe to version changes
      await this.subscribeToVersionChanges();

      this.isInitialized = true;
      this.logger.info(
        createLogContext(this.contextService, "onModuleInit", {
          version: this.currentVersion,
        }),
        "Hot reload watcher initialized",
      );
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "onModuleInit", error),
        "Failed to initialize hot reload watcher",
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
      this.logger.info(
        createLogContext(this.contextService, "onModuleDestroy", {}),
        "Hot reload watcher destroyed",
      );
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "onModuleDestroy", error),
        "Error destroying hot reload watcher",
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
          createLogContext(this.contextService, "refreshBundle", { version }),
          "Bundle not found for version, attempting to load current bundle",
        );
        const currentBundle = await this.bundleService.getCurrentBundle();
        if (currentBundle) {
          this.currentBundle = currentBundle;
          this.currentVersion = currentBundle.version;
          this.logger.info(
            createLogContext(this.contextService, "refreshBundle", {
              version: this.currentVersion,
            }),
            "Loaded bundle into memory cache",
          );
        } else {
          this.logger.warn(
            createLogContext(this.contextService, "refreshBundle", {}),
            "No bundle available, cache will be empty",
          );
        }
        return;
      }

      // Validate bundle before caching
      if (this.validateBundle(bundle)) {
        this.currentBundle = bundle;
        this.currentVersion = version;
        this.logger.debug(
          createLogContext(this.contextService, "refreshBundle", {
            version: this.currentVersion,
          }),
          "Refreshed bundle in memory cache",
        );
      } else {
        this.logger.error(
          createLogContext(this.contextService, "refreshBundle", { version }),
          "Invalid bundle, not caching",
        );
      }
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "refreshBundle", error),
        "Failed to refresh bundle",
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
          this.logger.info(
            createLogContext(this.contextService, "subscribeToVersionChanges", {
              version: data.version,
            }),
            "Received version change notification",
          );

          // Refresh bundle from Redis
          await this.refreshBundle();
        } catch (error) {
          this.logger.error(
            createErrorContext(
              this.contextService,
              "subscribeToVersionChanges",
              error,
            ),
            "Failed to process version change notification",
          );
        }
      }
    });

    await this.subscriber.subscribe(channel);
    this.logger.debug(
      createLogContext(this.contextService, "subscribeToVersionChanges", {
        channel,
      }),
      "Subscribed to version change channel",
    );
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
        createLogContext(this.contextService, "validateBundle", {
          bundleVersion: bundle.version,
          metadataVersion: bundle.metadata.version,
        }),
        "Bundle version mismatch",
      );
      return false;
    }

    if (bundle.rules.length !== bundle.metadata.rulesCount) {
      this.logger.error(
        createLogContext(this.contextService, "validateBundle", {
          rulesLength: bundle.rules.length,
          metadataRulesCount: bundle.metadata.rulesCount,
        }),
        "Bundle rules count mismatch",
      );
      return false;
    }

    return true;
  }
}
