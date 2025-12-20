import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "permissions";

export interface PermissionsMetadata {
  resource: string;
  action: string;
}

/**
 * Decorator to specify required permissions for an endpoint
 * @param resource - Resource name (e.g., "products", "orders")
 * @param action - Action name (e.g., "read", "write", "refund")
 * @example @Permissions("products", "write")
 */
export const Permissions = (resource: string, action: string) =>
  SetMetadata<typeof PERMISSIONS_KEY, PermissionsMetadata>(PERMISSIONS_KEY, {
    resource,
    action,
  });
