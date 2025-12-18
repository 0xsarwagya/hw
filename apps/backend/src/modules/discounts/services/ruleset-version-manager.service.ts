import { Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../../../common/logging/logging.helper";
import { RedisStoreService } from "../../redis-store/redis-store.service";

/**
 * Manages discount ruleset versioning for atomic hot reloads
 * Version increments atomically on every ruleset update
 */
@Injectable()
export class RulesetVersionManager implements OnModuleInit {
  private client!: Redis;
  private readonly redisStoreService: RedisStoreService;
  private readonly versionKey = "discount-ruleset-version";
  private readonly versionChannel = "discount-ruleset-version";

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
   * Ensure Redis client is initialized
   */
  private async ensureClientInitialized(): Promise<void> {
    if (!this.client) {
      this.client = await this.redisStoreService.getClient();
    }
  }

  /**
   * Get current ruleset version
   */
  async getCurrentVersion(): Promise<number> {
    await this.ensureClientInitialized();
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
        createErrorContext(this.contextService, "getCurrentVersion", error),
        "Failed to get ruleset version",
      );
      throw error;
    }
  }

  /**
   * Increment version atomically and publish notification
   * Returns the new version number
   */
  async incrementVersion(): Promise<number> {
    await this.ensureClientInitialized();
    try {
      const newVersion = await this.client.incr(this.versionKey);
      this.logger.info(
        createLogContext(this.contextService, "incrementVersion", {
          version: newVersion,
        }),
        "Ruleset version incremented",
      );

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
        createErrorContext(this.contextService, "incrementVersion", error),
        "Failed to increment ruleset version",
      );
      throw error;
    }
  }

  /**
   * Set version explicitly (for initialization or rollback)
   */
  async setVersion(version: number): Promise<void> {
    await this.ensureClientInitialized();
    try {
      await this.client.set(this.versionKey, version.toString());
      this.logger.info(
        createLogContext(this.contextService, "setVersion", { version }),
        "Ruleset version set",
      );

      // Publish version change notification
      await this.client.publish(
        this.versionChannel,
        JSON.stringify({ version, timestamp: new Date().toISOString() }),
      );
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "setVersion", error, {
          version,
        }),
        "Failed to set ruleset version",
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
