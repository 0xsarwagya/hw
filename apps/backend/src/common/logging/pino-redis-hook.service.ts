import { Injectable, OnModuleInit } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import type { Logger } from "pino";
import {
  SystemLogEntry,
  SystemLogsStorageService,
} from "../../modules/system-logs/system-logs-storage.service";

/**
 * Service to hook Pino logs into Redis storage
 * This service intercepts Pino log calls and stores them in Redis
 */
@Injectable()
export class PinoRedisHookService implements OnModuleInit {
  constructor(
    private readonly logger: PinoLogger,
    private readonly storageService: SystemLogsStorageService,
  ) {}

  async onModuleInit() {
    // Only store logs if LOG_LEVEL is not "debug"
    const logLevel = process.env.LOG_LEVEL || "info";
    if (logLevel === "debug") {
      return;
    }

    try {
      // Get the underlying Pino logger instance
      const pinoLogger = this.logger.logger;

      // Wrap log methods to also store in Redis
      const logLevels = [
        "info",
        "warn",
        "error",
        "debug",
        "fatal",
        "trace",
      ] as const;

      for (const level of logLevels) {
        const originalMethod = pinoLogger[level].bind(pinoLogger) as (
          objOrMsg?: object | string,
          ...args: unknown[]
        ) => Logger;
        (pinoLogger as unknown as Record<string, unknown>)[level] = (
          objOrMsg?: object | string,
          ...args: unknown[]
        ) => {
          // Call original method
          const result = originalMethod(objOrMsg, ...args);

          // Store in Redis asynchronously
          this.storeLogInRedis(level, objOrMsg, args).catch(() => {
            // Silently fail - log storage shouldn't break the app
          });

          return result;
        };
      }
    } catch (error) {
      // Log but don't throw - Redis hook failure shouldn't break the app
      console.error("Failed to hook Pino logs to Redis:", error);
    }
  }

  private async storeLogInRedis(
    level: string,
    objOrMsg?: object | string,
    args: unknown[] = [],
  ): Promise<void> {
    try {
      // Skip if storage service is not available (prevents errors during initialization)
      if (!this.storageService) {
        return;
      }

      // Extract log data
      let logData: Record<string, unknown> = {};
      let message = "";

      if (typeof objOrMsg === "string") {
        message = objOrMsg;
        logData =
          args[0] && typeof args[0] === "object" && args[0] !== null
            ? (args[0] as Record<string, unknown>)
            : {};
      } else if (typeof objOrMsg === "object" && objOrMsg !== null) {
        logData = objOrMsg as Record<string, unknown>;
        const objWithMsg = objOrMsg as Record<string, unknown>;
        message =
          (typeof objWithMsg.msg === "string" ? objWithMsg.msg : "") ||
          (typeof args[0] === "string" ? args[0] : "") ||
          "";
      }

      // Skip storing logs about log storage failures to prevent recursion
      if (
        typeof message === "string" &&
        (message.includes("Failed to store system log") ||
          message.includes("Failed to get logs"))
      ) {
        return;
      }

      // Map level string to number for consistency
      const levelMap: Record<string, string> = {
        trace: "trace",
        debug: "debug",
        info: "info",
        warn: "warn",
        error: "error",
        fatal: "fatal",
      };

      const logEntry: SystemLogEntry = {
        timestamp: new Date().toISOString(),
        level: levelMap[level] || "info",
        message: message || JSON.stringify(logData),
        context: logData,
        traceId: (logData.traceId as string) || undefined,
        spanId: (logData.spanId as string) || undefined,
        module:
          (logData.module as string) ||
          (logData.service as string) ||
          "unknown",
      };

      await this.storageService.storeLog(logEntry);
    } catch (_error) {
      // Silently fail - don't log errors here to prevent recursion
    }
  }
}
