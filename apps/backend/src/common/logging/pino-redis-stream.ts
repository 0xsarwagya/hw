import { Writable } from "node:stream";
import {
  SystemLogEntry,
  SystemLogsStorageService,
} from "../../modules/system-logs/system-logs-storage.service";

/**
 * Custom Pino stream that duplicates logs to Redis via SystemLogsStorageService
 */
export function createPinoRedisStream(
  storageService: SystemLogsStorageService,
): Writable {
  const stream = new Writable({
    objectMode: true,
    write(chunk: unknown, _encoding, callback) {
      // Only store logs if LOG_LEVEL is not "debug"
      const logLevel = process.env.LOG_LEVEL || "info";
      if (logLevel === "debug") {
        callback();
        return;
      }

      // Extract log entry from Pino chunk
      // Pino chunks can be objects or strings
      let logData: Record<string, unknown> = {};
      if (typeof chunk === "string") {
        try {
          const parsed = JSON.parse(chunk);
          logData =
            typeof parsed === "object" && parsed !== null
              ? (parsed as Record<string, unknown>)
              : { msg: chunk };
        } catch {
          logData = { msg: chunk };
        }
      } else if (typeof chunk === "object" && chunk !== null) {
        logData = chunk as Record<string, unknown>;
      }

      // Map Pino level numbers to strings
      const levelMap: Record<number, string> = {
        10: "trace",
        20: "debug",
        30: "info",
        40: "warn",
        50: "error",
        60: "fatal",
      };

      const timestamp =
        typeof logData.time === "string"
          ? logData.time
          : new Date().toISOString();
      const levelNum = typeof logData.level === "number" ? logData.level : 30; // Default to info
      const level = levelMap[levelNum] || "info";
      const message =
        typeof logData.msg === "string" ? logData.msg : JSON.stringify(logData);
      const traceId =
        typeof logData.traceId === "string" ? logData.traceId : undefined;
      const spanId =
        typeof logData.spanId === "string" ? logData.spanId : undefined;
      const module =
        typeof logData.module === "string"
          ? logData.module
          : typeof logData.service === "string"
            ? logData.service
            : "unknown";

      const logEntry: SystemLogEntry = {
        timestamp,
        level,
        message,
        context: {
          ...logData,
          // Remove Pino-specific fields
          time: undefined,
          level: undefined,
          msg: undefined,
          pid: undefined,
          hostname: undefined,
        },
        traceId,
        spanId,
        module,
      };

      // Store log asynchronously (don't block)
      storageService.storeLog(logEntry).catch((error) => {
        // Silently fail - log storage shouldn't break the app
        console.error("Failed to store log in Redis:", error);
      });

      callback();
    },
  });

  return stream;
}
