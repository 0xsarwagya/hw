import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { Observable } from "rxjs";
import { SystemLogsStorageService } from "../../modules/system-logs/system-logs-storage.service";
import { ContextService } from "./context.service";

@Injectable()
export class SystemLogsInterceptor implements NestInterceptor {
  constructor(
    readonly _logger: PinoLogger,
    readonly _contextService: ContextService,
    readonly _storageService: SystemLogsStorageService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Only store logs if LOG_LEVEL is not "debug"
    const logLevel = process.env.LOG_LEVEL || "info";
    if (logLevel === "debug") {
      return next.handle();
    }

    // Intercept Pino logs and duplicate to Redis
    // This is a simplified version - in production, you'd hook into Pino's stream
    // For now, we'll rely on the service being called explicitly

    return next.handle();
  }
}
