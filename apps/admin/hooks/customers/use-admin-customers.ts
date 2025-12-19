"use client";

import { endpoints } from "@/lib/endpoints";
import type {
  CustomerQueryParams,
  PaginatedCustomersResponse,
} from "@/lib/types/customers";
import { useApiQuery } from "../use-api-query";

export function useAdminCustomers(params?: CustomerQueryParams) {
  return useApiQuery<PaginatedCustomersResponse>(endpoints.customers.list, {
    params: params as Record<string, string | number | boolean | undefined>,
    enabled: true,
  });
}
