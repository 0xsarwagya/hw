import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PinoLogger } from "nestjs-pino";
import { RATE_LIMIT_KEY } from "../decorators/rate-limit.decorator";
import { ContextService } from "../logging/context.service";
import {
  createErrorContext,
  createLogContext,
} from "../logging/logging.helper";
import { RateLimitConfig } from "../rate-limiting/rate-limit.config";
import { RateLimitService } from "../rate-limiting/rate-limit.service";

/**
 * Guard to enforce rate limits based on @RateLimit() decorator metadata
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
    private readonly logger: PinoLogger,
    private readonly contextService: ContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Get rate limit config from handler or class metadata
    const config = this.reflector.getAllAndOverride<RateLimitConfig>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no rate limit config, allow request
    if (!config) {
      return true;
    }

    // Skip if authenticated and skipIfAuthenticated is true
    if (config.skipIfAuthenticated && request.user) {
      return true;
    }

    try {
      // Extract identifier based on key type
      let identifier: string;
      if (config.keyType === "ip+email") {
        const email = this.rateLimitService.extractEmail(request);
        if (!email) {
          // If email is required but not found, allow request but log warning
          this.logger.warn(
            createLogContext(this.contextService, "rateLimit", {
              keyType: config.keyType,
              message: "Email not found in request body",
            }),
            "Rate limit check skipped: email required but not found",
          );
          return true;
        }
        identifier = this.rateLimitService.extractIdentifier(
          config.keyType,
          request,
          email,
        );
      } else {
        identifier = this.rateLimitService.extractIdentifier(
          config.keyType,
          request,
        );
      }

      // Check rate limit
      const state = await this.rateLimitService.checkRateLimit(
        config,
        identifier,
      );

      // Store state in request for interceptor to set headers
      request.rateLimitState = state;

      // Check if limit exceeded
      if (state.count > config.limit) {
        this.logger.warn(
          createLogContext(this.contextService, "rateLimitExceeded", {
            identifier,
            count: state.count,
            limit: config.limit,
            keyType: config.keyType,
            ttl: state.ttl,
          }),
          "Rate limit exceeded",
        );

        throw new HttpException(
          `Rate limit exceeded. Please try again after ${state.ttl} seconds.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      this.logger.debug(
        createLogContext(this.contextService, "rateLimitCheck", {
          identifier,
          count: state.count,
          limit: config.limit,
          remaining: state.remaining,
          keyType: config.keyType,
        }),
        "Rate limit check passed",
      );

      return true;
    } catch (error) {
      // Re-throw HttpException (rate limit exceeded)
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.TOO_MANY_REQUESTS
      ) {
        throw error;
      }

      // Log other errors but allow request (fail-safe)
      this.logger.error(
        createErrorContext(this.contextService, "rateLimitError", error, {
          config,
        }),
        "Error checking rate limit",
      );

      // Fail-safe: allow request if Redis is unavailable
      // For strict security, you might want to throw here instead
      return true;
    }
  }
}
