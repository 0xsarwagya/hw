import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { RateLimitState } from "../rate-limiting/rate-limit.service";

/**
 * Interceptor to set rate limit headers on responses
 * Reads rate limit state from request (set by RateLimitGuard)
 */
@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get rate limit state from request (set by RateLimitGuard)
    const rateLimitState: RateLimitState | undefined = request.rateLimitState;

    if (rateLimitState) {
      // Set rate limit headers
      response.setHeader("x-ratelimit-limit", rateLimitState.limit.toString());
      response.setHeader(
        "x-ratelimit-remaining",
        rateLimitState.remaining.toString(),
      );
      response.setHeader(
        "x-ratelimit-reset",
        rateLimitState.resetTime.toString(),
      );
      response.setHeader(
        "x-vcecom-ratelimited",
        (rateLimitState.count > rateLimitState.limit).toString(),
      );
    } else {
      // If no rate limit state, set default headers (no rate limiting applied)
      // This ensures headers are always present for consistency
      response.setHeader("x-ratelimit-limit", "0");
      response.setHeader("x-ratelimit-remaining", "0");
      response.setHeader("x-ratelimit-reset", "0");
      response.setHeader("x-vcecom-ratelimited", "false");
    }

    return next.handle();
  }
}
