import { Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";
import { RedisStoreService } from "../../redis-store/redis-store.service";

@Injectable()
export class PricingVersionManager {
  private readonly logger = new Logger(PricingVersionManager.name);
  private readonly client: Redis;
  private readonly versionKey = "pricing-ruleset-version";
  private readonly versionChannel = "pricing-ruleset-version";

  constructor(redisStoreService: RedisStoreService) {
    this.client = redisStoreService.getClient();
  }

  async getCurrentVersion(): Promise<number> {
    try {
      const versionStr = await this.client.get(this.versionKey);
      if (!versionStr) {
        await this.client.set(this.versionKey, "1");
        return 1;
      }
      return parseInt(versionStr, 10);
    } catch (error) {
      this.logger.error(
        `Failed to get pricing ruleset version: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  async incrementVersion(): Promise<number> {
    try {
      const newVersion = await this.client.incr(this.versionKey);
      this.logger.log(`Pricing ruleset version incremented to ${newVersion}`);
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
        `Failed to increment pricing ruleset version: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  async setVersion(version: number): Promise<void> {
    try {
      await this.client.set(this.versionKey, version.toString());
      this.logger.log(`Pricing ruleset version set to ${version}`);
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
