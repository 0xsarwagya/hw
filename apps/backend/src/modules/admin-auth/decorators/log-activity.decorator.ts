import { SetMetadata } from "@nestjs/common";

export const LOG_ACTIVITY_KEY = "logActivity";

export interface LogActivityMetadata {
  action: string;
  entityId?: string; // Name of the parameter that holds the entity ID (e.g., 'id', 'reviewId')
  captureDiff?: boolean; // Whether to capture before/after diff
  entityType?: string; // Entity type for diff capture (e.g., 'product', 'order', 'discount')
}

/**
 * Decorator to automatically log admin activities
 * @param action - The action being performed (e.g., "product.create", "discount.update")
 * @param entityId - Optional entity ID parameter name (default: "id")
 * @param options - Optional configuration for diff capture
 */
export const LogActivity = (
  action: string,
  entityId?: string,
  options?: { captureDiff?: boolean; entityType?: string },
) =>
  SetMetadata(LOG_ACTIVITY_KEY, {
    action,
    entityId,
    captureDiff: options?.captureDiff,
    entityType: options?.entityType,
  } as LogActivityMetadata);
