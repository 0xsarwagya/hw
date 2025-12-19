"use client";

import { endpoints } from "@/lib/endpoints";
import type { CustomerGroupMember } from "@/lib/types/customer-groups";
import { useApiQuery } from "../use-api-query";

export function useAdminCustomerGroupMembers(groupId: string) {
  return useApiQuery<CustomerGroupMember[]>(
    endpoints.customerGroups.members(groupId),
    {
      enabled: !!groupId,
    },
  );
}
