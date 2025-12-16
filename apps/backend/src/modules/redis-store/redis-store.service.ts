import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import Redis, { RedisOptions } from "ioredis";

@Injectable()
export class RedisStoreService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisStoreService.name);
  private client: Redis | null = null;

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
            `Redis connection retry attempt ${times}, waiting ${delay}ms`,
          );
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      };

      this.client = new Redis(redisUrl, options);

      this.client.on("connect", () => {
        this.logger.log("Redis client connecting...");
      });

      this.client.on("ready", () => {
        this.logger.log("Redis client ready");
      });

      this.client.on("error", (error) => {
        this.logger.error(`Redis client error: ${error.message}`, error.stack);
      });

      this.client.on("close", () => {
        this.logger.warn("Redis client connection closed");
      });

      this.client.on("reconnecting", () => {
        this.logger.log("Redis client reconnecting...");
      });

      // Wait for connection to be ready
      await this.client.ping();
      this.logger.log(`Redis client connected to ${redisUrl}`);
    } catch (error) {
      this.logger.error(
        `Failed to initialize Redis client: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Cleanup Redis connection
   */
  async onModuleDestroy() {
    if (this.client) {
      this.logger.log("Disconnecting Redis client...");
      await this.client.quit();
      this.client = null;
      this.logger.log("Redis client disconnected");
    }
  }
}
