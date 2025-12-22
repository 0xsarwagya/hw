import { PinoLogger } from "nestjs-pino";
import { ContextService } from "../logging/context.service";
import { createErrorContext } from "../logging/logging.helper";

/**
 * Wrapper for database queries with error handling
 * Returns default value on error instead of throwing
 */
export async function safeDbQuery<T>(
  queryFn: () => Promise<T>,
  defaultValue: T,
  logger: PinoLogger,
  contextService: ContextService,
  context: {
    operation: string;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    logger.error(
      createErrorContext(
        contextService,
        context.operation,
        error,
        context.metadata || {},
      ),
      context.errorMessage || "Database query failed",
    );
    return defaultValue;
  }
}

/**
 * Wrapper for database queries that should throw on error
 * Logs the error before re-throwing
 */
export async function dbQueryWithLogging<T>(
  queryFn: () => Promise<T>,
  logger: PinoLogger,
  contextService: ContextService,
  context: {
    operation: string;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    logger.error(
      createErrorContext(
        contextService,
        context.operation,
        error,
        context.metadata || {},
      ),
      context.errorMessage || "Database query failed",
    );
    throw error;
  }
}
