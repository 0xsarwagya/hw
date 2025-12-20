import { Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../common/logging/context.service";
import { createErrorContext } from "../../common/logging/logging.helper";
import { RedisStoreService } from "../redis-store/redis-store.service";

export interface SystemLogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
  traceId?: string;
  spanId?: string;
  module?: string;
}

@Injectable()
export class SystemLogsStorageService implements OnModuleInit {
  private client!: Redis;
  private readonly maxRecordsPerHour = 5000;
  private readonly ttlHours = 24;

  constructor(
    private readonly redisStoreService: RedisStoreService,
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
  ) {}

  async onModuleInit() {
    this.client = await this.redisStoreService.getClient();
  }

  /**
   * Store a log entry in Redis
   */
  async storeLog(entry: SystemLogEntry): Promise<void> {
    try {
      const date = new Date(entry.timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hour = String(date.getHours()).padStart(2, "0");

      const key = `logs:system:${year}${month}${day}:${hour}`;

      // Add log entry to list
      await this.client.lpush(key, JSON.stringify(entry));

      // Trim list to max records per hour
      await this.client.ltrim(key, 0, this.maxRecordsPerHour - 1);

      // Set TTL (24 hours)
      await this.client.expire(key, this.ttlHours * 60 * 60);
    } catch (error) {
      // Don't throw - log storage failure shouldn't break the app
      this.logger.warn(
        createErrorContext(this.contextService, "storeLog", error, { entry }),
        "Failed to store system log",
      );
    }
  }

  /**
   * Get logs for a specific hour
   */
  async getLogsForHour(
    year: number,
    month: number,
    day: number,
    hour: number,
  ): Promise<SystemLogEntry[]> {
    try {
      const key = `logs:system:${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}:${String(hour).padStart(2, "0")}`;
      const logs = await this.client.lrange(key, 0, -1);
      return logs.map((log) => JSON.parse(log) as SystemLogEntry);
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "getLogsForHour", error, {
          year,
          month,
          day,
          hour,
        }),
        "Failed to get logs for hour",
      );
      return [];
    }
  }

  /**
   * Get all log keys matching a date range
   */
  async getLogKeys(from: Date, to: Date): Promise<string[]> {
    try {
      const keys: string[] = [];
      const current = new Date(from);

      while (current <= to) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, "0");
        const day = String(current.getDate()).padStart(2, "0");
        const hour = String(current.getHours()).padStart(2, "0");

        const key = `logs:system:${year}${month}${day}:${hour}`;
        const exists = await this.client.exists(key);
        if (exists) {
          keys.push(key);
        }

        // Move to next hour
        current.setHours(current.getHours() + 1);
      }

      return keys;
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "getLogKeys", error, {
          from,
          to,
        }),
        "Failed to get log keys",
      );
      return [];
    }
  }
}
