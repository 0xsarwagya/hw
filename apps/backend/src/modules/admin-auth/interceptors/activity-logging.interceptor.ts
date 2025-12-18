import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { ContextService } from "../../../common/logging/context.service";
import { AdminActivityService } from "../admin-activity.service";
import {
  LOG_ACTIVITY_KEY,
  LogActivityMetadata,
} from "../decorators/log-activity.decorator";

@Injectable()
export class ActivityLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly activityService: AdminActivityService,
    readonly _contextService: ContextService, // Renamed to _contextService to avoid unused private member lint error
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.get<LogActivityMetadata>(
      LOG_ACTIVITY_KEY,
      context.getHandler(),
    );

    // If no metadata, skip logging
    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Only log if user is authenticated and is an admin
    if (!user || !user.id) {
      return next.handle();
    }

    // Check if user is an admin role
    const adminRoles = ["admin", "support", "reviewer", "marketing"];
    if (!adminRoles.includes(user.role)) {
      return next.handle();
    }

    // Extract entity ID from request params, body, or query
    let entityId: string | undefined;
    if (metadata.entityId) {
      // If entityId is specified, try to get it from params, body, or query
      entityId =
        request.params?.[metadata.entityId] ||
        request.body?.[metadata.entityId] ||
        request.query?.[metadata.entityId];
    } else {
      // Default: try to get "id" from params
      entityId = request.params?.id;
    }

    // Extract metadata from request body (excluding sensitive fields)
    const metadataFields: Record<string, unknown> = {};
    if (request.body) {
      const sensitiveFields = ["password", "passwordhash", "token", "secret"];
      Object.keys(request.body).forEach((key) => {
        if (!sensitiveFields.includes(key.toLowerCase())) {
          metadataFields[key] = request.body[key];
        }
      });
    }

    // Log activity after successful execution
    return next.handle().pipe(
      tap({
        next: () => {
          // Log successful activity
          this.activityService.logActivity({
            adminId: user.id,
            action: metadata.action,
            entityId,
            metadata:
              Object.keys(metadataFields).length > 0
                ? metadataFields
                : undefined,
          });
        },
        error: (error) => {
          // Log failed activity with error info
          this.activityService.logActivity({
            adminId: user.id,
            action: metadata.action,
            entityId,
            metadata: {
              ...metadataFields,
              error: error.message,
              errorType: error.constructor.name,
            },
          });
        },
      }),
    );
  }
}
