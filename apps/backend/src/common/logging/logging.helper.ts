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
 * Get structured context from ContextService
 * Extracts request context fields for inclusion in log statements
 */
export function getStructuredContext(
  contextService: ContextService,
): Partial<LogContext> {
  const context = contextService.get();
  if (!context) {
    return {};
  }

  return {
    requestId: context.requestId,
    traceId: context.traceId,
    spanId: context.spanId,
    correlationId: context.correlationId,
    customerId: context.customerId,
    orderId: context.orderId,
    checkoutId: context.checkoutId,
    cartId: context.cartId,
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
