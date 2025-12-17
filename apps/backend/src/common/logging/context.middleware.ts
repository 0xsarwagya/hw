import { randomUUID } from "node:crypto";
import { Injectable, NestMiddleware } from "@nestjs/common";
import { trace } from "@opentelemetry/api";
import { NextFunction } from "express";
import { PinoLogger } from "nestjs-pino";
import { ContextService, RequestContext } from "./context.service";
import { ExtendedRequest, ExtendedResponse } from "./types";

/**
 * Middleware to create request-scoped context
 * Generates requestId, extracts correlationId, and stores in AsyncLocalStorage
 */
@Injectable()
export class ContextMiddleware implements NestMiddleware {
  constructor(
    private readonly contextService: ContextService,
    private readonly logger: PinoLogger,
  ) {}

  use(req: ExtendedRequest, res: ExtendedResponse, next: NextFunction): void {
    // Extract or generate requestId
    const requestId = (req.headers["x-request-id"] as string) || randomUUID();

    // Extract correlationId from headers
    const correlationId = req.headers["x-correlation-id"] as string | undefined;

    // Extract client IP
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      (req.headers["x-real-ip"] as string) ||
      req.socket.remoteAddress ||
      "unknown";

    // Extract OTEL trace context if available
    const span = trace.getActiveSpan();
    const traceId = span?.spanContext().traceId;
    const spanId = span?.spanContext().spanId;

    // Create request context
    const requestContext: RequestContext = {
      requestId,
      correlationId,
      ip,
      traceId,
      spanId,
    };

    // Store context in AsyncLocalStorage
    this.contextService.run(requestContext, () => {
      // Create child logger with context
      const childLogger = this.logger.logger.child({
        requestId,
        correlationId,
        traceId,
        spanId,
        ip,
      });

      // Attach logger to request for use in controllers/services
      req.logger = childLogger;

      // Log request start (skip favicon and other static assets)
      if (
        !req.url?.match(
          /^\/(favicon\.ico|robots\.txt|.*\.(ico|png|jpg|jpeg|gif|svg|css|js))$/i,
        )
      ) {
        childLogger.info(
          {
            method: req.method,
            url: req.url,
          },
          "Incoming request",
        );
      }

      // Store context in response for access in exception filters
      res.requestContext = requestContext;

      next();
    });
  }
}
