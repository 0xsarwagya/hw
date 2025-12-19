/**
 * Customer Group-related TypeScript types
 * Mapped from backend DTOs
 */

export interface CustomerGroup {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  priceLists: CustomerGroupPriceList[];
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerGroupPriceList {
  id: string;
  name: string;
  priority: number;
  assignedAt: Date;
}

export interface CustomerGroupMember {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  joinedAt: Date;
}

export interface CreateCustomerGroupInput {
  name: string;
  description?: string;
  isActive?: boolean;
}

export type UpdateCustomerGroupInput = Partial<CreateCustomerGroupInput>;

export interface AssignPriceListToGroupInput {
  priceListId: string;
  priority?: number;
}
