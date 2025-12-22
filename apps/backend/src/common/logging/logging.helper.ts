import { trace } from "@opentelemetry/api";
import { ContextService } from "./context.service";

/**
 * Common log fields interface for structured logging
 */
export interface LogContext {
  operation: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  correlationId?: string;
  customerId?: string;
  orderId?: string;
  checkoutId?: string;
  cartId?: string;
  [key: string]: unknown;
}

/**
 * Error log fields interface
 */
export interface ErrorLogContext extends LogContext {
  error: string;
  errorType?: string;
  stack?: string;
}

/**
 * Extract trace and span IDs from OpenTelemetry active span
 * Returns empty object if no active span exists
 */
function extractTraceContextFromSpan(): { traceId?: string; spanId?: string } {
  try {
    const activeSpan = trace.getActiveSpan();
    if (!activeSpan) {
      return {};
    }

    const spanContext = activeSpan.spanContext();
    if (
      !spanContext.traceId ||
      spanContext.traceId === "00000000000000000000000000000000"
    ) {
      return {};
    }

    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
    };
  } catch {
    return {};
  }
}

/**
 * Get structured context from ContextService
 * Extracts request context fields for inclusion in log statements
 * Also includes trace/span IDs from active OpenTelemetry span if available
 */
export function getStructuredContext(
  contextService: ContextService,
): Partial<LogContext> {
  const context = contextService.get();
  const spanContext = extractTraceContextFromSpan();

  // Prefer trace/span IDs from active span (more accurate)
  // Fall back to context service if span not available
  const traceId = spanContext.traceId || context?.traceId;
  const spanId = spanContext.spanId || context?.spanId;

  if (!context && !traceId) {
    return {};
  }

  return {
    requestId: context?.requestId,
    traceId,
    spanId,
    correlationId: context?.correlationId,
    customerId: context?.customerId,
    orderId: context?.orderId,
    checkoutId: context?.checkoutId,
    cartId: context?.cartId,
  };
}

/**
 * Create error log context with standard error fields
 */
export function createErrorContext(
  contextService: ContextService,
  operation: string,
  error: unknown,
  additionalContext?: Record<string, unknown>,
): ErrorLogContext {
  const baseContext = getStructuredContext(contextService);
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorType = error instanceof Error ? error.constructor.name : "Unknown";
  const stack = error instanceof Error ? error.stack : undefined;

  return {
    operation,
    ...baseContext,
    error: errorMessage,
    errorType,
    stack,
    ...additionalContext,
  };
}

/**
 * Create log context with operation name and optional additional fields
 * Automatically includes trace/span IDs from active OpenTelemetry span
 */
export function createLogContext(
  contextService: ContextService,
  operation: string,
  additionalContext?: Record<string, unknown>,
): LogContext {
  const baseContext = getStructuredContext(contextService);
  return {
    operation,
    ...baseContext,
    ...additionalContext,
  };
}

/**
 * Create log context with active span context
 * Useful when you want to ensure trace/span IDs are included even if context service doesn't have them
 */
export function createSpanAwareLogContext(
  operation: string,
  additionalContext?: Record<string, unknown>,
): LogContext {
  const spanContext = extractTraceContextFromSpan();
  return {
    operation,
    ...spanContext,
    ...additionalContext,
  };
}
