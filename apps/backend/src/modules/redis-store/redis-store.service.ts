import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis, { RedisOptions } from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../common/logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../../common/logging/logging.helper";

@Injectable()
export class RedisStoreService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;

  constructor(
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
  ) {}

  /**
   * Get Redis client instance
   * @throws Error if Redis is not initialized
   */
  getClient(): Redis {
    if (!this.client) {
      throw new Error("Redis client not initialized. Call onModuleInit first.");
    }
    return this.client;
  }

  /**
   * Initialize Redis connection
   */
  async onModuleInit() {
    try {
      const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
      const options: RedisOptions = {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          this.logger.warn(
            createLogContext(this.contextService, "redisRetry", {
              attempt: times,
              delayMs: delay,
            }),
            "Redis connection retry attempt",
          );
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      };

      this.client = new Redis(redisUrl, options);

      this.client.on("connect", () => {
        this.logger.info(
          createLogContext(this.contextService, "redisConnect", {}),
          "Redis client connecting",
        );
      });

      this.client.on("ready", () => {
        this.logger.info(
          createLogContext(this.contextService, "redisReady", {}),
          "Redis client ready",
        );
      });

      this.client.on("error", (error) => {
        this.logger.error(
          createErrorContext(this.contextService, "redisError", error),
          "Redis client error",
        );
      });

      this.client.on("close", () => {
        this.logger.warn(
          createLogContext(this.contextService, "redisClose", {}),
          "Redis client connection closed",
        );
      });

      this.client.on("reconnecting", () => {
        this.logger.info(
          createLogContext(this.contextService, "redisReconnecting", {}),
          "Redis client reconnecting",
        );
      });

      // Wait for connection to be ready
      await this.client.ping();
      this.logger.info(
        createLogContext(this.contextService, "redisConnected", {
          redisUrl: process.env.REDIS_URL || "default",
        }),
        "Redis client connected",
      );
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "redisInit", error, {
          redisUrl: process.env.REDIS_URL || "default",
        }),
        "Failed to initialize Redis client",
      );
      throw error;
    }
  }

  /**
   * Cleanup Redis connection
   */
  async onModuleDestroy() {
    if (this.client) {
      this.logger.info(
        createLogContext(this.contextService, "redisDisconnect", {}),
        "Disconnecting Redis client",
      );
      await this.client.quit();
      this.client = null;
      this.logger.info(
        createLogContext(this.contextService, "redisDisconnected", {}),
        "Redis client disconnected",
      );
    }
  }
}
