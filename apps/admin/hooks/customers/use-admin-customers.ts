"use client";

import { useApiQuery } from "../use-api-query";
import { endpoints } from "@/lib/endpoints";
import type { PaginatedCustomersResponse, CustomerQueryParams } from "@/lib/types/customers";

export function useAdminCustomers(params?: CustomerQueryParams) {
  return useApiQuery<PaginatedCustomersResponse>(endpoints.customers.list, {
    params: params as Record<string, string | number | boolean | undefined>,
    enabled: true,
  });
}

