import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { ContextService } from "./context.service";
import { ContextExtractorService } from "./context-extractor.service";
import { ExtendedRequest } from "./types";

/**
 * Interceptor to enrich context after authentication
 * Runs after guards, so user info is available
 */
@Injectable()
export class ContextEnrichmentInterceptor implements NestInterceptor {
  constructor(
    private readonly contextService: ContextService,
    private readonly contextExtractor: ContextExtractorService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<ExtendedRequest>();

    // Enrich context with user info and business context
    // This runs after authentication, so req.user is available
    const enrichedContext = this.contextExtractor.extractFromRequest(request);

    // Update context with enriched data
    // Only set values that are part of RequestContext
    if (enrichedContext.requestId) {
      this.contextService.setValue("requestId", enrichedContext.requestId);
    }
    if (enrichedContext.correlationId) {
      this.contextService.setValue(
        "correlationId",
        enrichedContext.correlationId,
      );
    }
    if (enrichedContext.ip) {
      this.contextService.setValue("ip", enrichedContext.ip);
    }
    if (enrichedContext.traceId) {
      this.contextService.setValue("traceId", enrichedContext.traceId);
    }
    if (enrichedContext.spanId) {
      this.contextService.setValue("spanId", enrichedContext.spanId);
    }
    if (enrichedContext.customerId) {
      this.contextService.setValue("customerId", enrichedContext.customerId);
    }
    if (enrichedContext.cartId) {
      this.contextService.setValue("cartId", enrichedContext.cartId);
    }
    if (enrichedContext.orderId) {
      this.contextService.setValue("orderId", enrichedContext.orderId);
    }
    if (enrichedContext.checkoutId) {
      this.contextService.setValue("checkoutId", enrichedContext.checkoutId);
    }

    return next.handle().pipe(
      tap(() => {
        // Context is automatically available throughout the request lifecycle
      }),
    );
  }
}
