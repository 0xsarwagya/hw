"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useAdminCustomers } from "@/hooks/customers/use-admin-customers";
import type { PaginationData } from "@/hooks/use-pagination";
import type { FetchError } from "@/lib/api";
import {
  CUSTOMER_DEFAULT_LIMIT,
  CUSTOMER_DEFAULT_PAGE,
} from "@/lib/constants/customers.constants";
import type { CustomerQueryParams } from "@/lib/types/customers";
import { PaginationControls } from "../common/pagination-controls";
import { QueryState } from "../common/query-state";
import { SearchInput } from "../common/search-input";
import { CustomersTable } from "./customers-table";
import { CustomersTableSkeleton } from "./customers-table-skeleton";
import { EmptyCustomersState } from "./empty-customers-state";

/**
 * Client component for customers page
 * Handles all client-side logic including state management and interactions
 */
export function CustomersPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialFilters = parseFiltersFromSearchParams(searchParams);
  const [customerFilters, setCustomerFilters] =
    useState<CustomerQueryParams>(initialFilters);
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || "",
  );

  const {
    data: customersData,
    isLoading,
    error,
    refetch,
  } = useAdminCustomers(customerFilters);

  useSyncFiltersToUrl(customerFilters, router);

  const handlePageChange = useCallback((newPage: number) => {
    setCustomerFilters((prev) => ({ ...prev, page: newPage }));
  }, []);

  const paginationData: PaginationData | undefined = customersData
    ? {
        page: customersData.page,
        limit: customersData.limit,
        total: customersData.total,
        totalPages: customersData.totalPages,
        hasNextPage: customersData.page < customersData.totalPages,
        hasPreviousPage: customersData.page > 1,
      }
    : undefined;

  const handlePreviousPage = useCallback(() => {
    if (paginationData?.hasPreviousPage) {
      handlePageChange(paginationData.page - 1);
    }
  }, [paginationData, handlePageChange]);

  const handleNextPage = useCallback(() => {
    if (paginationData?.hasNextPage) {
      handlePageChange(paginationData.page + 1);
    }
  }, [paginationData, handlePageChange]);

  const paginationInfo = paginationData
    ? {
        startItem: (paginationData.page - 1) * paginationData.limit + 1,
        endItem: Math.min(
          paginationData.page * paginationData.limit,
          paginationData.total,
        ),
        total: paginationData.total,
        currentPage: paginationData.page,
        totalPages: paginationData.totalPages,
      }
    : null;

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    setCustomerFilters((prev) => ({
      ...prev,
      search: value || undefined,
      page: CUSTOMER_DEFAULT_PAGE,
    }));
  }, []);

  return (
    <AdminPageLayout
      title="Customers"
      description="Manage your customers"
      filters={
        <div className="flex gap-2">
          <SearchInput
            placeholder="Search customers..."
            value={searchInput}
            onChange={handleSearchChange}
          />
        </div>
      }
      pagination={
        <PaginationControls
          paginationInfo={paginationInfo}
          onPreviousPage={handlePreviousPage}
          onNextPage={handleNextPage}
          canGoPrevious={paginationData?.hasPreviousPage ?? false}
          canGoNext={paginationData?.hasNextPage ?? false}
          isLoading={isLoading}
          itemLabel="customers"
        />
      }
    >
      {error && (
        <ErrorDisplay
          error={error as FetchError}
          onRetry={() => refetch()}
          className="mb-4"
        />
      )}

      <QueryState
        isLoading={isLoading}
        error={null}
        data={customersData}
        loadingComponent={<CustomersTableSkeleton />}
        emptyComponent={
          <EmptyCustomersState hasSearchFilter={!!customerFilters.search} />
        }
      >
        <CustomersTable customers={customersData?.data || []} />
      </QueryState>
    </AdminPageLayout>
  );
}

/**
 * Parses search parameters from URL into CustomerQueryParams
 */
function parseFiltersFromSearchParams(
  searchParams: URLSearchParams,
): CustomerQueryParams {
  return {
    page: parseInt(
      searchParams.get("page") || String(CUSTOMER_DEFAULT_PAGE),
      10,
    ),
    limit: parseInt(
      searchParams.get("limit") || String(CUSTOMER_DEFAULT_LIMIT),
      10,
    ),
    search: searchParams.get("search") || undefined,
  };
}

/**
 * Hook to sync customer filters to URL when they change
 */
function useSyncFiltersToUrl(
  filters: CustomerQueryParams,
  router: ReturnType<typeof useRouter>,
) {
  useEffect(() => {
    const urlParams = new URLSearchParams();

    if (filters.page && filters.page > CUSTOMER_DEFAULT_PAGE) {
      urlParams.set("page", filters.page.toString());
    }
    if (filters.limit && filters.limit !== CUSTOMER_DEFAULT_LIMIT) {
      urlParams.set("limit", filters.limit.toString());
    }
    if (filters.search) urlParams.set("search", filters.search);

    router.replace(`/customers?${urlParams.toString()}`, { scroll: false });
  }, [filters, router]);
}
