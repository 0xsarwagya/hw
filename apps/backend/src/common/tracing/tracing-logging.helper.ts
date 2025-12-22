import { context, Span, SpanStatusCode, trace } from "@opentelemetry/api";
import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../logging/context.service";
import { createLogContext } from "../logging/logging.helper";

export interface WithSpanOptions {
  /** Operation name for the span */
  operation: string;
  /** Additional attributes to add to the span */
  attributes?: Record<string, string | number | boolean>;
  /** Whether to log span start/end */
  logLifecycle?: boolean;
  /** Additional context for logging */
  logContext?: Record<string, unknown>;
}

export interface SpanLogger {
  span: Span;
  logger: PinoLogger;
  end: () => void;
  setStatus: (status: { code: SpanStatusCode; message?: string }) => void;
  recordException: (exception: Error) => void;
  setAttribute: (key: string, value: string | number | boolean) => void;
}

/**
 * Create a span and logger together
 * Returns an object with span, logger, and helper methods
 */
export function createSpanLogger(
  tracer: ReturnType<typeof trace.getTracer>,
  logger: PinoLogger,
  contextService: ContextService,
  options: WithSpanOptions,
): SpanLogger {
  const {
    operation,
    attributes = {},
    logLifecycle = true,
    logContext = {},
  } = options;

  // Get parent span context if available
  const parentSpan = trace.getActiveSpan();
  const parentContext = parentSpan
    ? trace.setSpan(context.active(), parentSpan)
    : context.active();

  // Create new span
  const span = tracer.startSpan(
    operation,
    {
      attributes: {
        "operation.name": operation,
        ...attributes,
      },
    },
    parentContext,
  );

  // Set span in context
  const _spanContext = trace.setSpan(context.active(), span);

  // Create logger with trace/span IDs
  const spanContextData = span.spanContext();
  const childLogger = logger.logger.child({
    traceId: spanContextData.traceId,
    spanId: spanContextData.spanId,
    operation,
    ...logContext,
  });

  // Log span start if requested
  if (logLifecycle) {
    childLogger.debug(
      {
        ...createLogContext(contextService, operation, logContext),
        traceId: spanContextData.traceId,
        spanId: spanContextData.spanId,
      },
      `Starting span: ${operation}`,
    );
  }

  return {
    span,
    logger: {
      ...logger,
      logger: childLogger,
    } as PinoLogger,
    end: () => {
      if (logLifecycle) {
        childLogger.debug(
          {
            ...createLogContext(contextService, operation, logContext),
            traceId: spanContextData.traceId,
            spanId: spanContextData.spanId,
          },
          `Completed span: ${operation}`,
        );
      }
      span.end();
    },
    setStatus: (status: { code: SpanStatusCode; message?: string }) => {
      span.setStatus(status);
    },
    recordException: (exception: Error) => {
      span.recordException(exception);
    },
    setAttribute: (key: string, value: string | number | boolean) => {
      span.setAttribute(key, value);
    },
  };
}

/**
 * Execute a function within a span context with integrated logging
 */
export async function withSpan<T>(
  tracer: ReturnType<typeof trace.getTracer>,
  logger: PinoLogger,
  contextService: ContextService,
  options: WithSpanOptions,
  fn: (spanLogger: SpanLogger) => T | Promise<T>,
): Promise<T> {
  const spanLogger = createSpanLogger(tracer, logger, contextService, options);
  const spanContext = trace.setSpan(context.active(), spanLogger.span);

  try {
    const result = await context.with(spanContext, async () => {
      return await fn(spanLogger);
    });

    spanLogger.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    spanLogger.setStatus({
      code: SpanStatusCode.ERROR,
      message: errorObj.message,
    });
    spanLogger.recordException(errorObj);

    spanLogger.logger.error(
      {
        ...createLogContext(
          contextService,
          options.operation,
          options.logContext,
        ),
        error: {
          name: errorObj.name,
          message: errorObj.message,
          stack: errorObj.stack,
        },
      },
      `Span error: ${options.operation}`,
    );

    throw error;
  } finally {
    spanLogger.end();
  }
}
