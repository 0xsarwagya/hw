import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import { PinoLogger } from "nestjs-pino";

export interface TraceOptions {
  /** Custom operation name (defaults to method name) */
  operation?: string;
  /** Additional attributes to add to the span */
  attributes?: Record<string, string | number | boolean>;
  /** Whether to log span lifecycle */
  logLifecycle?: boolean;
}

/**
 * Decorator that automatically creates a span for a method
 * Integrates with logging to include trace/span IDs
 *
 * @example
 * ```typescript
 * class MyService {
 *   @Trace({ operation: "createOrder" })
 *   async createOrder(data: CreateOrderDto) {
 *     // Method automatically runs within a span
 *   }
 * }
 * ```
 */
export function Trace(options: TraceOptions = {}) {
  return (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;
    const targetClass = target as { constructor: { name: string } };
    const operation =
      options.operation || `${targetClass.constructor.name}.${propertyKey}`;
    const logLifecycle = options.logLifecycle ?? true;

    descriptor.value = async function (...args: unknown[]) {
      const tracer = trace.getTracer("vcecom-backend");

      // Get parent span context if available
      const parentSpan = trace.getActiveSpan();
      const parentContext = parentSpan
        ? trace.setSpan(context.active(), parentSpan)
        : context.active();

      // Create span
      const span = tracer.startSpan(
        operation,
        {
          attributes: {
            "operation.name": operation,
            "class.name": targetClass.constructor.name,
            "method.name": propertyKey,
            ...options.attributes,
          },
        },
        parentContext,
      );

      // Set span in context
      const spanContext = trace.setSpan(context.active(), span);

      // Try to get logger from context (if available)
      let logger: PinoLogger | undefined;
      try {
        // Try to get logger from 'this' if it's a NestJS service
        if (this && typeof this === "object" && "logger" in this) {
          logger = (this as { logger: PinoLogger }).logger;
        }
      } catch {
        // Ignore if logger not available
      }

      // Create child logger with trace/span IDs if available
      const spanContextData = span.spanContext();
      let childLogger: ReturnType<PinoLogger["logger"]["child"]> | undefined;
      if (logger) {
        childLogger = logger.logger.child({
          traceId: spanContextData.traceId,
          spanId: spanContextData.spanId,
          operation,
        });
      }

      // Log span start if logger available
      if (logLifecycle && childLogger) {
        childLogger.debug({ operation }, `Starting span: ${operation}`);
      }

      try {
        // Execute method within span context
        const result = await context.with(spanContext, async () => {
          return await originalMethod.apply(this, args);
        });

        // Set span status to OK
        span.setStatus({ code: SpanStatusCode.OK });

        // Log span end if logger available
        if (logLifecycle && childLogger) {
          childLogger.debug({ operation }, `Completed span: ${operation}`);
        }

        return result;
      } catch (error) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));

        // Set span status to ERROR
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: errorObj.message,
        });

        // Record exception
        span.recordException(errorObj);

        // Log error if logger available
        if (childLogger) {
          childLogger.error(
            {
              operation,
              error: {
                name: errorObj.name,
                message: errorObj.message,
                stack: errorObj.stack,
              },
            },
            `Span error: ${operation}`,
          );
        }

        throw error;
      } finally {
        span.end();
      }
    };

    return descriptor;
  };
}
