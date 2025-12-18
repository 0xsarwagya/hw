import { SetMetadata } from "@nestjs/common";

export const LOG_ACTIVITY_KEY = "logActivity";

export interface LogActivityMetadata {
  action: string;
  entityId?: string; // Name of the parameter that holds the entity ID (e.g., 'id', 'reviewId')
}

/**
 * Decorator to automatically log admin activities
 * @param action - The action being performed (e.g., "product.create", "discount.update")
 * @param entityId - Optional entity ID parameter name (default: "id")
 */
export const LogActivity = (action: string, entityId?: string) =>
  SetMetadata(LOG_ACTIVITY_KEY, { action, entityId } as LogActivityMetadata);
