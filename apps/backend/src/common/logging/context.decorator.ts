import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { RequestContext } from "./context.service";
import { ExtendedRequest, ExtendedResponse } from "./types";

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
    const _request = ctx.switchToHttp().getRequest<ExtendedRequest>();
    const response = ctx.switchToHttp().getResponse<ExtendedResponse>();

    // Get context from response (set by ContextMiddleware)
    const context = response.requestContext || {};

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
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<ExtendedRequest>();
    const response = ctx.switchToHttp().getResponse<ExtendedResponse>();

    return (
      response.requestContext?.requestId ||
      (request.headers["x-request-id"] as string) ||
      "unknown"
    );
  },
);

/**
 * Decorator to inject user ID from context
 * Usage: @UserId() userId: string
 */
export const UserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<ExtendedRequest>();
    // Note: userId is not part of RequestContext, get it from request.user
    return request.user?.id || undefined;
  },
);

/**
 * Decorator to inject customer ID from context
 * Usage: @CustomerId() customerId: string
 */
export const CustomerId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<ExtendedRequest>();
    const response = ctx.switchToHttp().getResponse<ExtendedResponse>();

    return (
      response.requestContext?.customerId ||
      request.user?.customerId ||
      request.user?.id ||
      undefined
    );
  },
);
