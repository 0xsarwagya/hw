import { Injectable, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../../common/logging/context.service";
import { createErrorContext } from "../../common/logging/logging.helper";
import { RedisStoreService } from "../redis-store/redis-store.service";
import {
  PaginatedSystemLogsResponseDto,
  QuerySystemLogsDto,
  SystemLogEntryDto,
} from "./dto/system-logs.dto";
import {
  SystemLogEntry,
  SystemLogsStorageService,
} from "./system-logs-storage.service";

@Injectable()
export class SystemLogsService implements OnModuleInit {
  private client!: Redis;

  constructor(
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
    private readonly storageService: SystemLogsStorageService,
    private readonly redisStoreService: RedisStoreService,
  ) {}

  async onModuleInit() {
    this.client = await this.redisStoreService.getClient();
  }

  /**
   * Get system logs with filters and pagination
   */
  async getLogs(
    query: QuerySystemLogsDto,
  ): Promise<PaginatedSystemLogsResponseDto> {
    try {
      // Parse date range
      const from = query.from
        ? new Date(query.from)
        : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours
      const to = query.to ? new Date(query.to) : new Date();

      // Get all log keys in date range
      const keys = await this.storageService.getLogKeys(from, to);

      // Fetch logs from all keys
      let allLogs: SystemLogEntry[] = [];
      for (const key of keys) {
        const logs = await this.getLogsFromKey(key);
        allLogs = allLogs.concat(logs);
      }

      // Sort by timestamp (newest first)
      allLogs.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA;
      });

      // Apply filters
      let filteredLogs = allLogs;

      if (query.level) {
        filteredLogs = filteredLogs.filter(
          (log) => log.level.toLowerCase() === query.level?.toLowerCase(),
        );
      }

      if (query.module) {
        filteredLogs = filteredLogs.filter(
          (log) => log.module?.toLowerCase() === query.module?.toLowerCase(),
        );
      }

      if (query.text) {
        const searchText = query.text.toLowerCase();
        filteredLogs = filteredLogs.filter(
          (log) =>
            log.message.toLowerCase().includes(searchText) ||
            JSON.stringify(log.context || {})
              .toLowerCase()
              .includes(searchText),
        );
      }

      // Apply cursor-based pagination
      const limit = query.limit || 100;
      let startIndex = 0;

      if (query.cursor) {
        const [timestamp, index] = query.cursor.split("-");
        const cursorTime = parseInt(timestamp, 10);
        // Find index of first log with timestamp <= cursorTime
        startIndex = filteredLogs.findIndex(
          (log) => new Date(log.timestamp).getTime() <= cursorTime,
        );
        if (startIndex === -1) {
          startIndex = 0;
        } else {
          // Add index offset
          startIndex += parseInt(index, 10);
        }
      }

      const paginatedLogs = filteredLogs.slice(startIndex, startIndex + limit);

      // Generate next cursor
      let nextCursor: string | undefined;
      if (
        paginatedLogs.length === limit &&
        startIndex + limit < filteredLogs.length
      ) {
        const lastLog = paginatedLogs[paginatedLogs.length - 1];
        const lastTimestamp = new Date(lastLog.timestamp).getTime();
        const nextIndex = startIndex + limit;
        nextCursor = `${lastTimestamp}-${nextIndex}`;
      }

      return {
        data: paginatedLogs.map((log) => this.mapToDto(log)),
        nextCursor,
        count: paginatedLogs.length,
      };
    } catch (error) {
      this.logger.error(
        createErrorContext(this.contextService, "getLogs", error, { query }),
        "Failed to get system logs",
      );
      throw error;
    }
  }

  /**
   * Get logs from a specific Redis key
   */
  private async getLogsFromKey(key: string): Promise<SystemLogEntry[]> {
    try {
      if (!this.client) {
        this.client = await this.redisStoreService.getClient();
      }
      const logs = await this.client.lrange(key, 0, -1);
      return logs.map((log) => JSON.parse(log) as SystemLogEntry);
    } catch (error) {
      this.logger.warn(
        createErrorContext(this.contextService, "getLogsFromKey", error, {
          key,
        }),
        "Failed to get logs from key",
      );
      return [];
    }
  }

  /**
   * Map storage entry to DTO
   */
  private mapToDto(entry: SystemLogEntry): SystemLogEntryDto {
    return {
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      context: entry.context,
      traceId: entry.traceId,
      spanId: entry.spanId,
      module: entry.module,
    };
  }
}
