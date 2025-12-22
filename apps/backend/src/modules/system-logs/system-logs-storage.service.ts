import { Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../common/logging/context.service";
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
  private client: Redis | null = null;
  private readonly maxRecordsPerHour = 5000;
  private readonly ttlHours = 24;
  private isStoringLog = false; // Guard against recursive logging

  constructor(
    private readonly redisStoreService: RedisStoreService,
    readonly _logger: PinoLogger,
    readonly _contextService: ContextService,
  ) {}

  async onModuleInit() {
    try {
      this.client = await this.redisStoreService.getClient();
    } catch (error) {
      // Use console.error to avoid recursive logging
      console.error(
        "Failed to initialize Redis client for system logs:",
        error,
      );
      this.client = null;
    }
  }

  /**
   * Store a log entry in Redis
   */
  async storeLog(entry: SystemLogEntry): Promise<void> {
    // Guard against recursive logging
    if (this.isStoringLog) {
      return;
    }

    // Check if client is initialized
    if (!this.client) {
      return;
    }

    // Check if Redis is connected before trying to write
    // If not connected and offline queue is enabled, commands will queue automatically
    // But we still want to check connection status to avoid errors
    try {
      // Check connection status - if not connected, the offline queue will handle it
      // But we'll catch errors gracefully
      const date = new Date(entry.timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hour = String(date.getHours()).padStart(2, "0");

      const key = `logs:system:${year}${month}${day}:${hour}`;

      this.isStoringLog = true;

      // Add log entry to list - will queue if Redis isn't connected yet
      await this.client.lpush(key, JSON.stringify(entry));

      // Trim list to max records per hour
      await this.client.ltrim(key, 0, this.maxRecordsPerHour - 1);

      // Set TTL (24 hours)
      await this.client.expire(key, this.ttlHours * 60 * 60);
    } catch (_error) {
      // Silently fail - log storage shouldn't break the app
      // Don't log errors here to prevent recursion
      // Commands will be queued if Redis isn't connected yet (with enableOfflineQueue: true)
    } finally {
      this.isStoringLog = false;
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
    if (!this.client) {
      return [];
    }

    try {
      const key = `logs:system:${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}:${String(hour).padStart(2, "0")}`;
      const logs = await this.client.lrange(key, 0, -1);
      return logs.map((log) => JSON.parse(log) as SystemLogEntry);
    } catch (error) {
      // Use console.error to avoid recursive logging
      console.error("Failed to get logs for hour:", error);
      return [];
    }
  }

  /**
   * Get all log keys matching a date range
   */
  async getLogKeys(from: Date, to: Date): Promise<string[]> {
    if (!this.client) {
      return [];
    }

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
      // Use console.error to avoid recursive logging
      console.error("Failed to get log keys:", error);
      return [];
    }
  }
}
