"use client";

import { endpoints } from "@/lib/endpoints";
import type { CustomerGroup } from "@/lib/types/customer-groups";
import { useApiQuery } from "../use-api-query";

export function useAdminCustomerGroup(id: string) {
  return useApiQuery<CustomerGroup>(endpoints.customerGroups.detail(id), {
    enabled: !!id,
  });
}
