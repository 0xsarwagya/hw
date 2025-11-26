import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      ("admin" | "customer")[]
    >("roles", [context.getHandler(), context.getClass()]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user (not authenticated), throw 401
    if (!user) {
      throw new UnauthorizedException(
        "Authentication required. Please provide a valid JWT token.",
      );
    }

    // If user role is in the required roles array, allow access
    if (requiredRoles.includes(user.role as "admin" | "customer")) {
      return true;
    }

    // If user role doesn't match any required role, throw 403
    throw new ForbiddenException(
      `Access denied. This endpoint requires one of these roles: ${requiredRoles.join(", ")}, but you have ${user.role} role.`,
    );
  }
}
