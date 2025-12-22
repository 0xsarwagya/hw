import { Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../../common/logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../../../common/logging/logging.helper";
import { RedisStoreService } from "../../redis-store/redis-store.service";

@Injectable()
export class PricingVersionManager implements OnModuleInit {
  private client!: Redis;
  private readonly redisStoreService: RedisStoreService;
  private readonly versionKey = "pricing-ruleset-version";
  private readonly versionChannel = "pricing-ruleset-version";

  constructor(
    redisStoreService: RedisStoreService,
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
  ) {
    this.redisStoreService = redisStoreService;
  }

  async onModuleInit() {
    try {
      this.client = await this.redisStoreService.getClient();
    } catch (error) {
      this.logger.warn(
        `Redis client not available during initialization - will retry when Redis is available: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      // Don't throw - allow app to start without Redis
    }
  }

  /**
   * Ensure Redis client is initialized
   */
  private async ensureClientInitialized(): Promise<void> {
    if (!this.client) {
      this.client = await this.redisStoreService.getClient();
    }
  }

  async getCurrentVersion(): Promise<number> {
    await this.ensureClientInitialized();
    try {
      const versionStr = await this.client.get(this.versionKey);
      if (!versionStr) {
        await this.client.set(this.versionKey, "1");
        return 1;
      }
      return parseInt(versionStr, 10);
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "getCurrentVersion", error),
        "Failed to get pricing ruleset version",
      );
      throw error;
    }
  }

  async incrementVersion(): Promise<number> {
    await this.ensureClientInitialized();
    try {
      const newVersion = await this.client.incr(this.versionKey);
      this.logger.info(
        createLogContext(this.contextService, "incrementVersion", {
          version: newVersion,
        }),
        "Pricing ruleset version incremented",
      );
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
        "Failed to increment pricing ruleset version",
      );
      throw error;
    }
  }

  async setVersion(version: number): Promise<void> {
    await this.ensureClientInitialized();
    try {
      await this.client.set(this.versionKey, version.toString());
      this.logger.info(
        createLogContext(this.contextService, "setVersion", { version }),
        "Pricing ruleset version set",
      );
      await this.client.publish(
        this.versionChannel,
        JSON.stringify({ version, timestamp: new Date().toISOString() }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to set pricing ruleset version: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  getVersionChannel(): string {
    return this.versionChannel;
  }
}
