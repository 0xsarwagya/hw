/**
 * Shipping methods TypeScript types
 * Mapped from backend DTOs
 */

export interface ShippingMethod {
  id: string;
  name: string;
  description: string | null;
  code: string;
  baseRate: number;
  estimatedDays: number;
  codAvailable: boolean;
  codCharge: number | null;
  isActive: boolean;
  priority: number;
  minOrderValue: number | null;
  maxOrderValue: number | null;
  restrictedZones: string[] | null;
  restrictedStates: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShippingMethodInput {
  name: string;
  description?: string;
  code: string;
  baseRate: number;
  estimatedDays: number;
  codAvailable?: boolean;
  codCharge?: number;
  isActive?: boolean;
  priority?: number;
  minOrderValue?: number;
  maxOrderValue?: number;
  restrictedZones?: string[];
  restrictedStates?: string[];
}

export type UpdateShippingMethodInput = Partial<CreateShippingMethodInput>;
