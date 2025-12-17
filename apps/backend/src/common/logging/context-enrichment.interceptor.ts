import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Request } from "express";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { ContextService } from "./context.service";
import { ContextExtractorService } from "./context-extractor.service";

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

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // Enrich context with user info and business context
    // This runs after authentication, so req.user is available
    const enrichedContext = this.contextExtractor.extractFromRequest(request);

    // Update context with enriched data
    Object.entries(enrichedContext).forEach(([key, value]) => {
      if (value !== undefined) {
        this.contextService.setValue(key as any, value);
      }
    });

    return next.handle().pipe(
      tap(() => {
        // Context is automatically available throughout the request lifecycle
      }),
    );
  }
}
