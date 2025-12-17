import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { RequestContext } from "./context.service";

/**
 * Decorator to inject request context into controller methods
 * Usage: @Context() context: RequestContext
 * Or: @Context('requestId') requestId: string
 *
 * Note: This uses the context stored in the response object by ContextMiddleware
 * For direct access to ContextService, inject it in the controller constructor
 */
export const Context = createParamDecorator(
  (data: keyof RequestContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const response = ctx.switchToHttp().getResponse();

    // Get context from response (set by ContextMiddleware)
    const context = (response as any).requestContext || {};

    if (data) {
      return context[data];
    }
    return context;
  },
);

/**
 * Decorator to inject request ID
 * Usage: @RequestId() requestId: string
 */
export const RequestId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const response = ctx.switchToHttp().getResponse();

    return (
      (response as any).requestContext?.requestId ||
      request.headers["x-request-id"] ||
      "unknown"
    );
  },
);

/**
 * Decorator to inject user ID from context
 * Usage: @UserId() userId: string
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const response = ctx.switchToHttp().getResponse();

    return (
      (response as any).requestContext?.userId ||
      (request as any).user?.id ||
      undefined
    );
  },
);

/**
 * Decorator to inject customer ID from context
 * Usage: @CustomerId() customerId: string
 */
export const CustomerId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const response = ctx.switchToHttp().getResponse();

    return (
      (response as any).requestContext?.customerId ||
      (request as any).user?.customerId ||
      (request as any).user?.id ||
      undefined
    );
  },
);
