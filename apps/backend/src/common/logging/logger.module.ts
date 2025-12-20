import { Global, Module } from "@nestjs/common";
import { LoggerModule as PinoLoggerModule } from "nestjs-pino";
import { SystemLogsModule } from "../../modules/system-logs/system-logs.module";
import { createPinoConfig } from "./pino.config";
import { PinoRedisHookService } from "./pino-redis-hook.service";

@Global() // Make LoggerModule global so PinoLogger is available everywhere
@Module({
  imports: [
    SystemLogsModule, // Import to make SystemLogsStorageService available
    PinoLoggerModule.forRoot({
      pinoHttp: {
        ...createPinoConfig(),
        // Custom serializers for request/response
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            headers: {
              // Redact sensitive headers
              authorization: "[Redacted]",
              cookie: "[Redacted]",
              ...Object.fromEntries(
                Object.entries(req.headers).filter(
                  ([key]) =>
                    !["authorization", "cookie"].includes(key.toLowerCase()),
                ),
              ),
            },
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
          err: (err) => ({
            type: err.type,
            message: err.message,
            stack: err.stack,
          }),
        },
        // Custom log message
        customLogLevel: (req, res, err) => {
          if (res.statusCode >= 400 && res.statusCode < 500) {
            return "warn";
          } else if (res.statusCode >= 500 || err) {
            return "error";
          }
          return "info";
        },
        // Auto log requests
        autoLogging: {
          ignore: (req) => {
            const url = req.url || "";
            // Ignore health check endpoints
            if (url.startsWith("/_health")) return true;
            // Ignore favicon and static assets
            if (
              url.match(
                /^\/(favicon\.ico|robots\.txt|.*\.(ico|png|jpg|jpeg|gif|svg|css|js))$/i,
              )
            ) {
              return true;
            }
            return false;
          },
        },
        // Add custom stream for Redis storage
        stream: undefined, // Will be set via hook
      },
    }),
  ],
  providers: [PinoRedisHookService],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
