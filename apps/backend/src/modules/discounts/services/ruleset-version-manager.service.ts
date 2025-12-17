import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { RedisStoreService } from "../../redis-store/redis-store.service";

/**
 * Manages discount ruleset versioning for atomic hot reloads
 * Version increments atomically on every ruleset update
 */
@Injectable()
export class RulesetVersionManager implements OnModuleInit {
  private readonly logger = new Logger(RulesetVersionManager.name);
  private client!: Redis;
  private readonly redisStoreService: RedisStoreService;
  private readonly versionKey = "discount-ruleset-version";
  private readonly versionChannel = "discount-ruleset-version";

  constructor(redisStoreService: RedisStoreService) {
    this.redisStoreService = redisStoreService;
  }

  async onModuleInit() {
    this.client = this.redisStoreService.getClient();
  }

  /**
   * Ensure Redis client is initialized
   */
  private ensureClientInitialized(): void {
    if (!this.client) {
      this.client = this.redisStoreService.getClient();
    }
  }

  /**
   * Get current ruleset version
   */
  async getCurrentVersion(): Promise<number> {
    this.ensureClientInitialized();
    try {
      const versionStr = await this.client.get(this.versionKey);
      if (!versionStr) {
        // Initialize version to 1 if not exists
        await this.client.set(this.versionKey, "1");
        return 1;
      }
      return parseInt(versionStr, 10);
    } catch (error) {
      this.logger.error(
        `Failed to get ruleset version: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Increment version atomically and publish notification
   * Returns the new version number
   */
  async incrementVersion(): Promise<number> {
    this.ensureClientInitialized();
    try {
      const newVersion = await this.client.incr(this.versionKey);
      this.logger.log(`Ruleset version incremented to ${newVersion}`);

      // Publish version change notification
      await this.client.publish(
        this.versionChannel,
        JSON.stringify({
          version: newVersion,
          timestamp: new Date().toISOString(),
        }),
      );

      return newVersion;
    } catch (error) {
      this.logger.error(
        `Failed to increment ruleset version: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Set version explicitly (for initialization or rollback)
   */
  async setVersion(version: number): Promise<void> {
    this.ensureClientInitialized();
    try {
      await this.client.set(this.versionKey, version.toString());
      this.logger.log(`Ruleset version set to ${version}`);

      // Publish version change notification
      await this.client.publish(
        this.versionChannel,
        JSON.stringify({ version, timestamp: new Date().toISOString() }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to set ruleset version: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Get version channel name for pub/sub subscription
   */
  getVersionChannel(): string {
    return this.versionChannel;
  }
}
