import { Injectable } from "@nestjs/common";
import { Request } from "express";
import { RequestContext } from "./context.service";

/**
 * Service for extracting comprehensive context from HTTP requests
 * Extracts user info, business context, and request metadata
 */
@Injectable()
export class ContextExtractorService {
  /**
   * Extract full context from request
   */
  extractFromRequest(req: Request): Partial<RequestContext> {
    const context: Partial<RequestContext> = {};

    // Extract request metadata
    context.requestId = this.extractRequestId(req);
    context.correlationId = this.extractCorrelationId(req);
    context.ip = this.extractIpAddress(req);

    // Extract user information
    const userInfo = this.extractUserInfo(req);
    if (userInfo) {
      context.customerId = userInfo.customerId;
      // Store user ID separately if needed
      (context as any).userId = userInfo.userId;
      (context as any).userRole = userInfo.role;
      (context as any).userEmail = userInfo.email;
    }

    // Extract business context from params, query, body
    context.cartId = this.extractCartId(req);
    context.orderId = this.extractOrderId(req);
    context.checkoutId = this.extractCheckoutId(req);
    context.customerId =
      context.customerId || this.extractCustomerIdFromParams(req);

    // Extract OTEL trace context
    const traceContext = this.extractTraceContext();
    if (traceContext) {
      context.traceId = traceContext.traceId;
      context.spanId = traceContext.spanId;
    }

    return context;
  }

  /**
   * Extract request ID from headers or generate one
   */
  extractRequestId(req: Request): string {
    return (
      (req.headers["x-request-id"] as string) ||
      (req.headers["x-request-id"] as string) ||
      this.generateRequestId()
    );
  }

  /**
   * Extract correlation ID from headers
   */
  extractCorrelationId(req: Request): string | undefined {
    return (
      (req.headers["x-correlation-id"] as string) ||
      (req.headers["x-correlation-id"] as string) ||
      undefined
    );
  }

  /**
   * Extract client IP address
   */
  extractIpAddress(req: Request): string {
    // Check X-Forwarded-For header (first IP in chain)
    const forwardedFor = req.headers["x-forwarded-for"] as string;
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }

    // Check X-Real-IP header
    const realIp = req.headers["x-real-ip"] as string;
    if (realIp) {
      return realIp;
    }

    // Fallback to socket remote address
    return req.socket.remoteAddress || "unknown";
  }

  /**
   * Extract user information from request (set by JWT guard)
   */
  extractUserInfo(req: Request): {
    userId?: string;
    customerId?: string;
    email?: string;
    role?: string;
  } | null {
    const user = (req as any).user;
    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      customerId: user.customerId || user.id, // Use customerId if available, otherwise userId
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Extract cart ID from request params, query, or body
   */
  extractCartId(req: Request): string | undefined {
    return (
      (req.params as any).cartId ||
      (req.query as any).cartId ||
      (req.body as any)?.cartId ||
      (req.body as any)?.cart_id ||
      undefined
    );
  }

  /**
   * Extract order ID from request params, query, or body
   */
  extractOrderId(req: Request): string | undefined {
    // Check params.id if it looks like an order ID
    const paramId = (req.params as any).id;
    if (
      paramId &&
      (paramId.startsWith("order_") || paramId.match(/^[a-f0-9-]{36}$/i))
    ) {
      return paramId;
    }

    return (
      (req.params as any).orderId ||
      (req.query as any).orderId ||
      (req.body as any)?.orderId ||
      (req.body as any)?.order_id ||
      undefined
    );
  }

  /**
   * Extract checkout ID from request params, query, or body
   */
  extractCheckoutId(req: Request): string | undefined {
    return (
      (req.params as any).checkoutId ||
      (req.query as any).checkoutId ||
      (req.body as any)?.checkoutId ||
      (req.body as any)?.checkout_id ||
      (req.body as any)?.checkoutSessionId ||
      undefined
    );
  }

  /**
   * Extract customer ID from request params or query
   */
  extractCustomerIdFromParams(req: Request): string | undefined {
    // Check params.id if it looks like a customer ID
    const paramId = (req.params as any).id;
    if (paramId && paramId.startsWith("customer_")) {
      return paramId;
    }

    return (
      (req.params as any).customerId ||
      (req.query as any).customerId ||
      undefined
    );
  }

  /**
   * Extract OTEL trace context
   */
  extractTraceContext(): { traceId?: string; spanId?: string } | null {
    try {
      // Dynamic import to avoid issues if OTEL is not initialized
      const { trace } = require("@opentelemetry/api");
      const span = trace.getActiveSpan();
      if (!span) {
        return null;
      }

      const spanContext = span.spanContext();
      return {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
      };
    } catch {
      return null;
    }
  }

  /**
   * Generate a new request ID
   */
  private generateRequestId(): string {
    const { randomUUID } = require("crypto");
    return randomUUID();
  }

  /**
   * Extract additional request metadata
   */
  extractRequestMetadata(req: Request): Record<string, unknown> {
    return {
      method: req.method,
      url: req.url,
      path: req.path,
      userAgent: req.headers["user-agent"],
      referer: req.headers.referer,
      origin: req.headers.origin,
      contentType: req.headers["content-type"],
      contentLength: req.headers["content-length"],
    };
  }
}
